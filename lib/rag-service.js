const RAGEngine = require('./rag-engine');
const config = require('./rag-config');

class RAGService {
    constructor() {
        this.ragEngine = new RAGEngine();
        this.initialized = false;
    }
    
    // Initialize the RAG service
    async initialize() {
        if (!this.initialized) {
            await this.ragEngine.loadKnowledgeBase();
            this.initialized = true;
        }
    }
    
    // Calculate risk score based on work metrics
    calculateRiskScore(workMetrics) {
        const factors = config.riskAssessment.factors;
        let totalScore = 0;
        let totalWeight = 0;
        
        // Overtime hours factor
        const overtimeScore = this.getFactorScore(
            workMetrics.overtime_hours, 
            factors.overtimeHours.thresholds,
            factors.overtimeHours.inverted
        );
        totalScore += overtimeScore * factors.overtimeHours.weight;
        totalWeight += factors.overtimeHours.weight;
        
        // Average working hours factor
        const avgHoursScore = this.getFactorScore(
            workMetrics.avg_working_hours,
            factors.avgWorkingHours.thresholds,
            factors.avgWorkingHours.inverted
        );
        totalScore += avgHoursScore * factors.avgWorkingHours.weight;
        totalWeight += factors.avgWorkingHours.weight;
        
        // Leave taken factor (inverted - less leave = higher risk)
        const leaveScore = this.getFactorScore(
            workMetrics.leave_taken,
            factors.leaveTaken.thresholds,
            factors.leaveTaken.inverted
        );
        totalScore += leaveScore * factors.leaveTaken.weight;
        totalWeight += factors.leaveTaken.weight;
        
        // Vacation taken factor (inverted)
        const vacationScore = this.getFactorScore(
            workMetrics.vacation_taken,
            factors.vacationTaken.thresholds,
            factors.vacationTaken.inverted
        );
        totalScore += vacationScore * factors.vacationTaken.weight;
        totalWeight += factors.vacationTaken.weight;
        
        const finalScore = totalScore / totalWeight;
        return Math.min(Math.max(finalScore, 0), 1); // Clamp between 0 and 1
    }
    
    // Get factor score based on thresholds
    getFactorScore(value, thresholds, inverted = false) {
        let score;
        
        if (!inverted) {
            if (value <= thresholds.low) score = 0;
            else if (value <= thresholds.medium) score = 0.5;
            else score = 1;
        } else {
            if (value >= thresholds.low) score = 0;
            else if (value >= thresholds.medium) score = 0.5;
            else score = 1;
        }
        
        return score;
    }
    
    // Determine risk level from score
    getRiskLevel(score) {
        const levels = config.riskAssessment.riskLevels;
        
        if (score >= levels.high.min) return 'High';
        if (score >= levels.medium.min) return 'Medium';
        return 'Low';
    }
    
    // Generate smart note using RAG
    async generateSmartNote(employeeData, workMetrics) {
        await this.initialize();
        
        // Calculate risk score and level
        const riskScore = this.calculateRiskScore(workMetrics);
        const riskLevel = this.getRiskLevel(riskScore);
        
        // Build query for knowledge base search
        const query = this.buildAnalysisQuery(employeeData, workMetrics, riskLevel);
        
        // Retrieve relevant documents
        const retrievedDocs = await this.ragEngine.searchSimilarDocuments(query);
        
        // Generate analysis using Mistral
        const prompt = this.buildAnalysisPrompt(employeeData, workMetrics, riskLevel, riskScore);
        const analysis = await this.ragEngine.generateResponse(prompt, { retrievedDocs });
        
        return {
            riskLevel,
            riskScore: Math.round(riskScore * 100) / 100,
            note: analysis,
            retrievedSources: retrievedDocs.length,
            confidence: this.calculateConfidence(retrievedDocs, riskScore)
        };
    }
    
    // Generate health recommendations using RAG
    async generateHealthRecommendations(employeeData, workMetrics) {
        await this.initialize();
        
        const riskLevel = this.getRiskLevel(this.calculateRiskScore(workMetrics));
        
        // Search for relevant health guidelines and best practices
        const query = `health recommendations ${riskLevel} risk burnout prevention wellness programs ${employeeData.department} ${employeeData.role}`;
        const retrievedDocs = await this.ragEngine.searchSimilarDocuments(query);
        
        const prompt = `Generate specific health and wellness recommendations for this employee:
        
Employee Profile:
- Name: ${employeeData.name}
- Department: ${employeeData.department}
- Role: ${employeeData.role}
- Risk Level: ${riskLevel}

Work Metrics:
- Average Working Hours: ${workMetrics.avg_working_hours}
- Overtime Hours: ${workMetrics.overtime_hours}
- Leave Taken: ${workMetrics.leave_taken} days
- Vacation Taken: ${workMetrics.vacation_taken} days

Please provide:
1. Immediate actions (next 1-2 weeks)
2. Short-term interventions (1-3 months)
3. Long-term wellness strategies (3-12 months)
4. Specific resources and support programs
5. Measurable goals and success metrics

Format as a structured JSON response with categories, actions, timelines, and expected outcomes.`;
        
        const recommendations = await this.ragEngine.generateResponse(prompt, { retrievedDocs });
        
        return {
            riskLevel,
            recommendations,
            basedOnSources: retrievedDocs.length,
            generatedAt: new Date().toISOString()
        };
    }
    
    // Build analysis query for knowledge base search
    buildAnalysisQuery(employeeData, workMetrics, riskLevel) {
        const factors = [];
        
        if (workMetrics.overtime_hours > 4) factors.push('excessive overtime');
        if (workMetrics.avg_working_hours > 10) factors.push('long working hours');
        if (workMetrics.vacation_taken === 0) factors.push('no vacation');
        if (workMetrics.leave_taken < 2) factors.push('insufficient leave');
        
        return `${riskLevel} burnout risk ${employeeData.department} ${employeeData.role} ${factors.join(' ')} intervention strategies best practices`;
    }
    
    // Build analysis prompt for Mistral
    buildAnalysisPrompt(employeeData, workMetrics, riskLevel, riskScore) {
        return `Analyze this employee's burnout risk and provide detailed insights:

Employee Information:
- Name: ${employeeData.name}
- Department: ${employeeData.department}
- Role: ${employeeData.role}

Work Metrics Analysis:
- Average Working Hours: ${workMetrics.avg_working_hours} hours/day
- Overtime Hours: ${workMetrics.overtime_hours} hours/week
- Leave Taken: ${workMetrics.leave_taken} days (recent period)
- Vacation Taken: ${workMetrics.vacation_taken} days (recent period)

Calculated Risk:
- Risk Level: ${riskLevel}
- Risk Score: ${(riskScore * 100).toFixed(1)}%

Please provide:
1. Detailed risk assessment explanation
2. Key contributing factors
3. Specific concerns for this employee's role and department
4. Immediate intervention recommendations
5. Long-term prevention strategies
6. Success metrics to track improvement

Be specific, actionable, and empathetic in your analysis.`;
    }
    
    // Calculate confidence based on retrieved documents and risk score
    calculateConfidence(retrievedDocs, riskScore) {
        const docConfidence = Math.min(retrievedDocs.length / 5, 1); // Max confidence with 5+ docs
        const riskConfidence = riskScore > 0.8 || riskScore < 0.2 ? 0.9 : 0.7; // Higher confidence for extreme scores
        
        return Math.round((docConfidence * 0.6 + riskConfidence * 0.4) * 100) / 100;
    }
    
    // Refresh knowledge base (call when new files are added)
    async refreshKnowledgeBase() {
        this.ragEngine.knowledgeBase.clear();
        this.ragEngine.embeddings.clear();
        await this.ragEngine.loadKnowledgeBase();
        console.log('Knowledge base refreshed');
    }
    
    // Get knowledge base statistics
    getKnowledgeBaseStats() {
        const stats = {
            totalDocuments: this.ragEngine.knowledgeBase.size,
            categories: {},
            lastUpdated: new Date().toISOString()
        };
        
        for (const doc of this.ragEngine.knowledgeBase.values()) {
            stats.categories[doc.category] = (stats.categories[doc.category] || 0) + 1;
        }
        
        return stats;
    }
}

module.exports = RAGService;
