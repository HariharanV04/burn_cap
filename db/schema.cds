namespace burnout.db;

entity Employee {
  key ID : Integer;
  name  : String;
  department : String ;
  role  : String;
}

entity Workmetrics {
  key ID : Integer;
  avg_working_hours : Decimal;
  overtime_hours : Decimal;
  leave_taken : Integer;
  vacation_taken : Integer;

}

entity Burnoutmetrics {
    key ID : Integer;
    risk_level : String;
    note : String;

}
