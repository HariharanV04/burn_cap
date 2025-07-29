// RAG Configuration for Mistral Large Integration

module.exports = {
    // Mistral AI Configuration
    mistral: {
        apiKey: process.env.MISTRAL_API_KEY,
        baseURL: 'https://api.mistral.ai/v1',
        model: 'mistral-large-latest',
        maxTokens: 4000,
        temperature: 0.3, // Lower for more consistent analysis
        systemPrompt: `You are an expert HR analyst and occupational health specialist with deep expertise in employee burnout prevention, intervention, and wellness programs. 

Your role is to:
1. Analyze employee work patterns and identify burnout risk factors
2. Generate personalized, actionable health recommendations
3. Provide evidence-based interventions based on research and best practices
4. Create detailed notes explaining risk assessments with specific reasoning

Always provide:
- Clear risk level justification
- Specific, actionable recommendations
- Timeline for interventions
- Expected outcomes
- Evidence-based reasoning from provided context

Be professional, empathetic, and focus on practical solutions that can be implemented by HR teams and managers.`
    },
    
    // Knowledge Base Configuration
    knowledgeBase: {
        basePath: './rag-knowledge-base',
        folders: {
            bestPractices: 'best-practices',
            caseStudies: 'case-studies', 
            researchPapers: 'research-papers',
            companyPolicies: 'company-policies',
            healthGuidelines: 'health-guidelines'
        },
        supportedFormats: ['.txt', '.md', '.pdf', '.docx', '.json'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        encoding: 'utf-8'
    },
    
    // Embedding Configuration (using Mistral embeddings)
    embeddings: {
        model: 'mistral-embed',
        dimension: 1024,
        batchSize: 50,
        chunkSize: 1000, // Characters per chunk
        chunkOverlap: 200 // Overlap between chunks
    },
    
    // Vector Search Configuration
    vectorSearch: {
        topK: 8, // Number of similar documents to retrieve
        similarityThreshold: 0.6, // Minimum similarity score
        maxContextLength: 8000, // Maximum context characters
        reranking: true,
        weights: {
            bestPractices: 0.3,
            caseStudies: 0.25,
            researchPapers: 0.2,
            healthGuidelines: 0.15,
            companyPolicies: 0.1
        }
    },
    
    // Risk Assessment Configuration
    riskAssessment: {
        factors: {
            overtimeHours: {
                weight: 0.35,
                thresholds: { low: 2, medium: 4, high: 6 }
            },
            avgWorkingHours: {
                weight: 0.25,
                thresholds: { low: 8, medium: 9, high: 10 }
            },
            leaveTaken: {
                weight: 0.2,
                thresholds: { low: 5, medium: 3, high: 1 }, // Inverted
                inverted: true
            },
            vacationTaken: {
                weight: 0.15,
                thresholds: { low: 3, medium: 2, high: 0 }, // Inverted
                inverted: true
            },
            workloadTrend: {
                weight: 0.05
            }
        },
        riskLevels: {
            low: { min: 0, max: 0.3, color: 'green' },
            medium: { min: 0.3, max: 0.7, color: 'yellow' },
            high: { min: 0.7, max: 1.0, color: 'red' }
        }
    },
    
    // Cache Configuration
    cache: {
        enabled: true,
        ttl: 3600, // 1 hour
        maxSize: 500,
        keyPrefix: 'rag_'
    },
    
    // Logging Configuration
    logging: {
        enabled: true,
        level: 'info', // debug, info, warn, error
        logFile: './logs/rag.log'
    }
};
