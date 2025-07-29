const fs = require('fs').promises;
const path = require('path');
const config = require('./rag-config');

class RAGEngine {
    constructor() {
        this.config = config;
        this.cache = new Map();
        this.knowledgeBase = new Map();
        this.embeddings = new Map();
        this.mistralClient = null;
        this.initializeMistral();
    }
    
    // Initialize Mistral AI client
    initializeMistral() {
        if (!this.config.mistral.apiKey) {
            console.warn('MISTRAL_API_KEY not found in environment variables');
            return;
        }
        
        // Using fetch for Mistral API calls
        this.mistralClient = {
            baseURL: this.config.mistral.baseURL,
            apiKey: this.config.mistral.apiKey
        };
    }
    
    // Load and index knowledge base
    async loadKnowledgeBase() {
        console.log('Loading knowledge base...');
        
        for (const [category, folder] of Object.entries(this.config.knowledgeBase.folders)) {
            const folderPath = path.join(this.config.knowledgeBase.basePath, folder);
            
            try {
                await this.indexFolder(folderPath, category);
            } catch (error) {
                console.warn(`Could not load folder ${folderPath}:`, error.message);
            }
        }
        
        console.log(`Knowledge base loaded: ${this.knowledgeBase.size} documents`);
    }
    
    // Index files in a folder
    async indexFolder(folderPath, category) {
        try {
            const files = await fs.readdir(folderPath);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isFile() && this.isSupportedFormat(file)) {
                    await this.indexFile(filePath, category);
                }
            }
        } catch (error) {
            // Folder doesn't exist yet, create it
            await fs.mkdir(folderPath, { recursive: true });
            console.log(`Created knowledge base folder: ${folderPath}`);
        }
    }
    
    // Check if file format is supported
    isSupportedFormat(filename) {
        const ext = path.extname(filename).toLowerCase();
        return this.config.knowledgeBase.supportedFormats.includes(ext);
    }
    
    // Index a single file
    async indexFile(filePath, category) {
        try {
            const content = await fs.readFile(filePath, this.config.knowledgeBase.encoding);
            const chunks = this.chunkText(content);
            
            for (let i = 0; i < chunks.length; i++) {
                const docId = `${category}_${path.basename(filePath)}_chunk_${i}`;
                const embedding = await this.generateEmbedding(chunks[i]);
                
                this.knowledgeBase.set(docId, {
                    id: docId,
                    content: chunks[i],
                    category: category,
                    filename: path.basename(filePath),
                    filePath: filePath,
                    chunkIndex: i
                });
                
                this.embeddings.set(docId, embedding);
            }
        } catch (error) {
            console.error(`Error indexing file ${filePath}:`, error);
        }
    }
    
    // Chunk text into smaller pieces
    chunkText(text) {
        const chunkSize = this.config.embeddings.chunkSize;
        const overlap = this.config.embeddings.chunkOverlap;
        const chunks = [];
        
        for (let i = 0; i < text.length; i += chunkSize - overlap) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        
        return chunks;
    }
    
    // Generate embedding using Mistral
    async generateEmbedding(text) {
        if (!this.mistralClient) {
            // Return dummy embedding if no API key
            return new Array(this.config.embeddings.dimension).fill(0).map(() => Math.random());
        }
        
        try {
            const response = await fetch(`${this.mistralClient.baseURL}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.mistralClient.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.embeddings.model,
                    input: [text]
                })
            });
            
            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            // Return dummy embedding on error
            return new Array(this.config.embeddings.dimension).fill(0).map(() => Math.random());
        }
    }
    
    // Calculate cosine similarity
    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
    
    // Search similar documents
    async searchSimilarDocuments(query, topK = null) {
        topK = topK || this.config.vectorSearch.topK;
        
        const queryEmbedding = await this.generateEmbedding(query);
        const similarities = [];
        
        for (const [docId, docEmbedding] of this.embeddings.entries()) {
            const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
            
            if (similarity >= this.config.vectorSearch.similarityThreshold) {
                similarities.push({
                    docId,
                    similarity,
                    document: this.knowledgeBase.get(docId)
                });
            }
        }
        
        // Sort by similarity and return top K
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }
    
    // Generate response using Mistral Large
    async generateResponse(prompt, context = {}) {
        if (!this.mistralClient) {
            return this.generateFallbackResponse(prompt, context);
        }
        
        try {
            const messages = [
                {
                    role: 'system',
                    content: this.config.mistral.systemPrompt
                },
                {
                    role: 'user',
                    content: this.buildPromptWithContext(prompt, context)
                }
            ];
            
            const response = await fetch(`${this.mistralClient.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.mistralClient.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.mistral.model,
                    messages: messages,
                    max_tokens: this.config.mistral.maxTokens,
                    temperature: this.config.mistral.temperature
                })
            });
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling Mistral API:', error);
            return this.generateFallbackResponse(prompt, context);
        }
    }
    
    // Build prompt with retrieved context
    buildPromptWithContext(prompt, context) {
        let contextText = '';
        
        if (context.retrievedDocs && context.retrievedDocs.length > 0) {
            contextText += '\n=== RELEVANT KNOWLEDGE BASE CONTENT ===\n';
            context.retrievedDocs.forEach((doc, index) => {
                contextText += `\n[${index + 1}] From ${doc.document.category}/${doc.document.filename}:\n`;
                contextText += `${doc.document.content}\n`;
                contextText += `(Relevance: ${(doc.similarity * 100).toFixed(1)}%)\n`;
            });
            contextText += '\n=== END KNOWLEDGE BASE CONTENT ===\n';
        }
        
        return `${prompt}\n${contextText}\n\nPlease provide a comprehensive analysis based on the employee data and the relevant knowledge base content above.`;
    }
    
    // Fallback response when Mistral API is not available
    generateFallbackResponse(prompt, context) {
        return {
            analysis: "API key not configured. Using fallback analysis.",
            riskLevel: context.calculatedRisk || "Medium",
            note: "Enhanced analysis requires Mistral API configuration.",
            recommendations: [
                "Configure MISTRAL_API_KEY environment variable",
                "Review work patterns manually",
                "Consult HR policies for guidance"
            ],
            confidence: 0.5
        };
    }
}

module.exports = RAGEngine;
