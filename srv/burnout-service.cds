using burnout.db as db from '../db/schema';

service BurnoutService {

    entity Employees      as projection on db.Employee;
    entity WorkMetrics    as projection on db.Workmetrics;
    entity BurnoutMetrics as projection on db.Burnoutmetrics;

    // Action to calculate burnout risk based on WorkMetrics
    action calculateBurnoutRisk();
}
