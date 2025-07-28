# Burn Cap - Employee Burnout Monitoring System

A CAP (Cloud Application Programming) project for monitoring employee burnout risk based on work metrics.

## Features

- Employee management
- Work metrics tracking (working hours, overtime, leave)
- Burnout risk assessment
- RESTful API with OData v4 support

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 8

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The service will be available at `http://localhost:4004`

### Development Mode

```bash
npm run dev
```

## API Endpoints

- `/odata/v4/burnout/Employees` - Employee management
- `/odata/v4/burnout/WorkMetrics` - Work metrics data
- `/odata/v4/burnout/BurnoutMetrics` - Burnout risk assessments

## Testing

Use the `test.http` file to test the API endpoints with various HTTP requests.

## Database

The project uses SQLite for local development with sample data for 25 employees across different departments.
