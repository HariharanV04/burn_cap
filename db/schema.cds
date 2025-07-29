namespace burnout.db;

entity Employee {
  key ID : Integer;
  name  : String(100);
  department : String(50);
  role  : String(100);

  // Associations to related entities
  workMetrics : Association to one Workmetrics on workMetrics.employee = $self;
  burnoutMetrics : Association to one Burnoutmetrics on burnoutMetrics.employee = $self;
}

entity Workmetrics {
  key ID : Integer;
  avg_working_hours : Decimal(4,2);
  overtime_hours : Decimal(4,2);
  leave_taken : Integer;
  vacation_taken : Integer;

  // Association back to employee
  employee : Association to one Employee on employee.ID = $self.ID;
}

entity Burnoutmetrics {
  key ID : Integer;
  risk_level : String(20);
  note : LargeString;

  // Association back to employee
  employee : Association to one Employee on employee.ID = $self.ID;
}
