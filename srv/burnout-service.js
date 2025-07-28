const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

    // Action to calculate burnout risk based on WorkMetrics
    this.on('calculateBurnoutRisk', async () => {
        const { WorkMetrics, BurnoutMetrics } = this.entities;

        // Get all work metrics
        const workMetrics = await SELECT.from(WorkMetrics);

        // Calculate burnout risk for each employee
        for (const metric of workMetrics) {
            let riskLevel = 'Low';
            let note = 'Healthy work-life balance maintained.';

            // Risk calculation logic
            if (metric.overtime_hours > 4 || metric.avg_working_hours > 10) {
                riskLevel = 'High';
                note = 'Excessive working hours detected. High burnout risk.';
            } else if (metric.overtime_hours > 2 || metric.avg_working_hours > 8.5) {
                riskLevel = 'Medium';
                note = 'Moderate workload with manageable stress levels.';
            }

            // Update or insert burnout metrics
            await UPSERT.into(BurnoutMetrics).entries({
                ID: metric.ID,
                risk_level: riskLevel,
                note: note
            });
        }

        return { message: 'Burnout risk calculation completed successfully.' };
    });

});
