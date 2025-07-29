# Burn Cap - AI-Powered Employee Burnout Monitoring System

A CAP (Cloud Application Programming) project with integrated RAG (Retrieval-Augmented Generation) using Mistral Large for intelligent burnout risk assessment, smart note generation, and personalized health recommendations.

## Features

### Core Functionality
- Employee management and work metrics tracking
- AI-powered burnout risk assessment using Mistral Large
- Smart note generation with contextual insights
- Personalized health recommendations
- Knowledge base integration for evidence-based analysis

### RAG-Enhanced Capabilities
- **Intelligent Analysis**: Mistral Large processes work patterns with knowledge base context
- **Smart Notes**: Detailed, personalized burnout risk explanations
- **Health Recommendations**: Evidence-based wellness strategies
- **Knowledge Base**: Extensible repository of best practices, case studies, and research
- **Continuous Learning**: System improves with additional knowledge documents

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 8
- Mistral AI API key (get from [console.mistral.ai](https://console.mistral.ai/))

### Installation

1. **Clone and install dependencies:**
```bash
git clone https://github.com/HariharanV04/burn_cap.git
cd burn_cap
npm install
```

2. **Set up environment variables:**
```bash
cp .env.template .env
# Edit .env and add your MISTRAL_API_KEY
```

3. **Deploy the database:**
```bash
npm run deploy
```

### Configuration

#### Mistral AI Setup
1. Sign up at [console.mistral.ai](https://console.mistral.ai/)
2. Generate an API key
3. Add to your `.env` file:
```
MISTRAL_API_KEY=your_api_key_here
```

#### Knowledge Base Setup
The system includes a pre-configured knowledge base in `rag-knowledge-base/` with:
- **best-practices/**: Burnout prevention strategies
- **case-studies/**: Successful intervention examples
- **research-papers/**: Academic research (add your own)
- **company-policies/**: Organization-specific policies
- **health-guidelines/**: Wellness recommendations

**To add your own knowledge:**
1. Add files (.txt, .md, .pdf, .docx, .json) to appropriate folders
2. Call the refresh endpoint: `POST /odata/v4/burnout/refreshKnowledgeBase`

### Running the Application

#### Development Mode (with file watching)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The service will be available at `http://localhost:4004`

## API Endpoints

### Standard Endpoints
- `/odata/v4/burnout/Employees` - Employee management
- `/odata/v4/burnout/WorkMetrics` - Work metrics data
- `/odata/v4/burnout/BurnoutMetrics` - Burnout risk assessments

### RAG-Enhanced Actions
- `POST /odata/v4/burnout/calculateBurnoutRisk` - AI-powered risk calculation
- `POST /odata/v4/burnout/generateHealthRecommendations` - Personalized wellness advice
- `POST /odata/v4/burnout/refreshKnowledgeBase` - Update knowledge base
- `POST /odata/v4/burnout/getKnowledgeBaseStats` - Knowledge base statistics

## Testing

Use the `test.http` file to test all endpoints including RAG-enhanced features:

```bash
# Test basic functionality
GET http://localhost:4004/odata/v4/burnout/Employees

# Test AI-powered analysis
POST http://localhost:4004/odata/v4/burnout/calculateBurnoutRisk

# Get personalized recommendations
POST http://localhost:4004/odata/v4/burnout/generateHealthRecommendations
Content-Type: application/json
{"employeeId": 1}
```

## Database

- **Engine**: SQLite for local development
- **Sample Data**: 25 employees across Engineering, HR, Finance, Sales, Marketing
- **Schema**: Employee, WorkMetrics, BurnoutMetrics entities
- **Deployment**: Automatic with `npm run deploy`

## RAG System Architecture

### Components
1. **RAG Engine** (`lib/rag-engine.js`): Core AI processing with Mistral Large
2. **RAG Service** (`lib/rag-service.js`): Business logic and risk assessment
3. **Knowledge Base**: Structured document repository
4. **Vector Search**: Semantic similarity matching
5. **Smart Generation**: Context-aware analysis and recommendations

### How It Works
1. **Document Indexing**: Knowledge base files are chunked and embedded
2. **Query Processing**: Employee data is analyzed for risk factors
3. **Context Retrieval**: Relevant documents are found using vector similarity
4. **AI Generation**: Mistral Large creates personalized insights
5. **Response Delivery**: Structured recommendations and risk assessments

### Risk Assessment Algorithm
- **Overtime Hours** (35% weight): Threshold-based scoring
- **Average Working Hours** (25% weight): Daily hour analysis
- **Leave Taken** (20% weight): Time-off utilization (inverted)
- **Vacation Taken** (15% weight): Vacation usage (inverted)
- **Workload Trend** (5% weight): Pattern analysis

## Knowledge Base Management

### Adding New Content
1. Place files in appropriate `rag-knowledge-base/` subdirectories
2. Supported formats: `.txt`, `.md`, `.pdf`, `.docx`, `.json`
3. Call refresh endpoint to update embeddings
4. Monitor knowledge base stats for verification

### Best Practices for Knowledge Content
- **Specific**: Include concrete examples and case studies
- **Actionable**: Provide clear steps and recommendations
- **Evidence-based**: Reference research and proven strategies
- **Categorized**: Use appropriate folders for content type
- **Updated**: Regularly refresh with new insights and policies

## Deployment

### Local Development
```bash
npm run dev
# Service available at http://localhost:4004
```

### Production Deployment
1. Set production environment variables
2. Configure production database (HANA/PostgreSQL)
3. Deploy using CAP deployment tools:
```bash
npm run build
npm run deploy
npm start
```

### Environment Variables
```bash
MISTRAL_API_KEY=your_api_key          # Required for AI features
NODE_ENV=production                   # Production mode
LOG_LEVEL=info                        # Logging level
CACHE_ENABLED=true                    # Enable response caching
```

## Monitoring and Analytics

### System Metrics
- Knowledge base document count and categories
- RAG query response times and success rates
- Employee risk level distributions
- Recommendation generation statistics

### Business Metrics
- Burnout risk trends over time
- Intervention effectiveness tracking
- Employee satisfaction correlation
- Health recommendation adoption rates

## Troubleshooting

### Common Issues

**RAG not working:**
- Verify `MISTRAL_API_KEY` is set correctly
- Check internet connectivity for API calls
- Review logs for API error messages

**Knowledge base empty:**
- Ensure files are in correct `rag-knowledge-base/` folders
- Call refresh endpoint after adding files
- Check file formats are supported

**Performance issues:**
- Enable caching in configuration
- Reduce knowledge base size if needed
- Monitor API rate limits

### Support
- Check logs in `./logs/rag.log`
- Use knowledge base stats endpoint for diagnostics
- Review Mistral AI console for API usage and errors
