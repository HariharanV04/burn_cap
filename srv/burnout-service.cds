using burnout.db as db from '../db/schema';

service BurnoutService {

    entity Employees as projection on db.Employee {
        *,
        workMetrics,
        burnoutMetrics
    };

    entity WorkMetrics as projection on db.Workmetrics {
        *,
        employee
    };

    entity BurnoutMetrics as projection on db.Burnoutmetrics {
        *,
        employee
    };

    // Enhanced action to calculate burnout risk using RAG analysis
    action calculateBurnoutRisk() returns {
        message: String;
        processedEmployees: Integer;
        timestamp: String;
    };

    // Generate personalized health recommendations using RAG
    action generateHealthRecommendations(employeeId: Integer) returns {
        employeeId: Integer;
        employeeName: String;
        department: String;
        role: String;
        riskLevel: String;
        recommendations: String;
        basedOnSources: Integer;
        generatedAt: String;
    };

    // Refresh the RAG knowledge base
    action refreshKnowledgeBase() returns {
        message: String;
        stats: {
            totalDocuments: Integer;
            categories: String;
            lastUpdated: String;
        };
    };

    // Get knowledge base statistics
    action getKnowledgeBaseStats() returns {
        totalDocuments: Integer;
        categories: String;
        lastUpdated: String;
    };
}
