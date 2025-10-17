# Intelligent Volunteer Matching System

A comprehensive multi-agent AI system that intelligently matches volunteers with opportunities using advanced skill profiling, event matching, and availability tracking.

## Project Structure

```
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI application entry point
│   ├── config.py           # Configuration settings
│   ├── database.py         # MongoDB connection setup
│   ├── models.py           # Pydantic models for data validation
│   ├── agents/             # Multi-agent system
│   │   ├── base_agent.py   # Base agent class
│   │   ├── skill_profiler.py    # AI skill extraction agent
│   │   ├── event_matcher.py     # Intelligent job matching agent
│   │   └── availability_tracker.py # Availability management agent
│   ├── services/           # Business logic services
│   │   ├── job_service.py       # Job retrieval and storage service
│   │   ├── cv_processor.py      # CV processing service
│   │   └── volunteer_service.py # Volunteer profile management
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── JobRetriever.js  # Job retrieval component
│   │   │   ├── CVUpload.js      # CV upload component
│   │   │   └── JobMatcher.js    # AI matching component
│   │   └── App.js          # Main React component
│   └── package.json        # Node.js dependencies
└── README.md              # This file
```

## Core Features

### Multi-Agent Architecture
- **Skill Profiler Agent**: AI-powered skill extraction from CVs with level assessment
- **Event Matcher Agent**: Intelligent matching algorithm with weighted scoring
- **Availability Tracker Agent**: Smart scheduling and conflict detection

### Volunteer Management
- **CV Upload & Processing**: Supports PDF, DOCX, and TXT formats
- **Automatic Skill Extraction**: AI identifies skills, experience levels, and categories
- **Profile Management**: Comprehensive volunteer profiles with preferences
- **Availability Scheduling**: Flexible time slot management

### Job Management
- **External API Integration**: Fetches opportunities from volunteerconnector.org
- **Data Storage**: MongoDB with proper validation and indexing
- **Smart Matching**: Multi-criteria matching with explainable results
- **Real-time Updates**: Automatic job synchronization

### Advanced Matching
- **Weighted Scoring**: Skills (40%), Location (25%), Availability (20%), Interest (15%)
- **Explainable AI**: Clear reasons for each match recommendation
- **Threshold Filtering**: Configurable minimum match requirements
- **Ranked Results**: Top matches prioritized by compatibility

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Quick Start (One-time setup already done)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (in a separate terminal)
cd frontend
npm install
npm start
```

Optional helper scripts are included at repo root: `start_backend.sh`, `start_frontend.sh`.

## Troubleshooting

- Port already in use (backend 8000):
  ```bash
  lsof -ti :8000 | xargs -r kill -9
  ```
- Port already in use (frontend 3000):
  ```bash
  lsof -ti :3000 | xargs -r kill -9
  ```
- ESLint warnings about anchors (href="#"): replace with a `button` or a real link.
- React warnings about missing hook deps: prefer adding the function to the dependency array or refactor to avoid stale closures.
- Pattern escape warnings: remove unnecessary escapes in regex patterns unless strictly needed.

## Recent UI Improvements

- Consistent card alignment for jobs across grid/list views in `ProfessionalDashboard.js` and `JobRetriever.js` using line clamps and fixed min-heights.
- Polished headers and backgrounds with subtle gradients.
- `VolunteerList.js` grid made responsive with `auto-fit` and consistent card heights for the CV uploads admin view.
- `CVUpload.js` modernized container and primary action styling.

## API Endpoints

### Job Management
- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `POST /api/jobs/retrieve` - Retrieve jobs from external API and store in database
- `GET /api/jobs` - Get stored jobs with pagination and filtering
- `GET /api/jobs/count` - Get total count of stored jobs
- `GET /api/jobs/filters` - Get available filter options

### Volunteer Management
- `POST /api/volunteers/upload-cv` - Upload CV and create volunteer profile
- `GET /api/volunteers/{profile_id}` - Get volunteer profile by ID
- `PUT /api/volunteers/{profile_id}` - Update volunteer profile
- `GET /api/volunteers` - Search volunteers with filters

### Availability Management
- `POST /api/volunteers/{profile_id}/availability` - Update volunteer availability
- `GET /api/volunteers/{profile_id}/availability` - Get volunteer availability

### AI Matching
- `GET /api/volunteers/{profile_id}/matches` - Get AI-powered job matches

### Example Usage

#### Upload CV and Create Profile
```bash
curl -X POST "http://localhost:8000/api/volunteers/upload-cv" \
     -F "file=@resume.pdf" \
     -F "name=John Doe" \
     -F "email=john@example.com" \
     -F "location=New York"
```

#### Get AI Job Matches
```bash
curl "http://localhost:8000/api/volunteers/{profile_id}/matches"
```

#### Update Availability
```bash
curl -X POST "http://localhost:8000/api/volunteers/{profile_id}/availability" \
     -H "Content-Type: application/json" \
     -d '[{"day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "status": "available"}]'
```

## Database Configuration

The system uses MongoDB Atlas with the following connection string:
```
mongodb+srv://volunteer:volunteerirwa@volunteer-irwa.jvvay25.mongodb.net/?retryWrites=true&w=majority&appName=volunteer-irwa
```

Database name: `volunteer_matching`
Collection name: `volunteer_jobs`

## Data Models

### VolunteerJob Schema
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "organization": "string",
  "location": "string",
  "skills_required": ["string"],
  "time_commitment": "string",
  "start_date": "datetime",
  "end_date": "datetime",
  "contact_email": "string",
  "contact_phone": "string",
  "website": "string",
  "external_id": "string",
  "source": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### VolunteerProfile Schema
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "skills": [
    {
      "name": "string",
      "level": "beginner|intermediate|advanced|expert",
      "years_experience": "number",
      "verified": "boolean"
    }
  ],
  "interests": ["string"],
  "availability": [
    {
      "day_of_week": "number (0-6)",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "status": "available|busy|partially_available"
    }
  ],
  "cv_text": "string",
  "cv_filename": "string",
  "experience_summary": "string",
  "preferred_time_commitment": "string",
  "max_distance": "number",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### JobMatch Schema
```json
{
  "_id": "ObjectId",
  "volunteer_id": "ObjectId",
  "job_id": "ObjectId",
  "match_score": "number (0.0-1.0)",
  "skill_match_score": "number (0.0-1.0)",
  "availability_match_score": "number (0.0-1.0)",
  "location_match_score": "number (0.0-1.0)",
  "interest_match_score": "number (0.0-1.0)",
  "reasons": ["string"],
  "created_at": "datetime"
}
```

## Testing the Multi-Agent System

### 1. Job Management
1. Start both backend and frontend servers
2. Navigate to "Job Management" tab
3. Click "Retrieve Jobs from API" to fetch jobs from volunteerconnector.org
4. View stored jobs with filtering capabilities

### 2. CV Upload & Profile Creation
1. Navigate to "Upload CV" tab
2. Fill in personal information (name, email, location)
3. Upload a CV file (PDF, DOCX, or TXT)
4. System will automatically extract skills and create profile
5. Note the generated Profile ID for matching

### 3. AI Job Matching
1. Navigate to "AI Job Matcher" tab
2. Enter the Profile ID from step 2
3. Click "Find Matches" to see AI-powered recommendations
4. View match scores, breakdowns, and explanations

### 4. API Testing
```bash
# Test CV upload
curl -X POST "http://localhost:8000/api/volunteers/upload-cv" \
     -F "file=@sample_cv.pdf" \
     -F "name=Test User" \
     -F "email=test@example.com"

# Test job matching
curl "http://localhost:8000/api/volunteers/{profile_id}/matches"
```

## Multi-Agent Architecture

### Agent Communication Flow
1. **CV Upload** → **Skill Profiler Agent** → **Profile Creation**
2. **Profile** → **Event Matcher Agent** → **Job Recommendations**
3. **Availability Update** → **Availability Tracker Agent** → **Schedule Management**

### Agent Responsibilities
- **Skill Profiler**: NLP-based skill extraction, level assessment, categorization
- **Event Matcher**: Multi-criteria scoring, weighted matching, explanation generation
- **Availability Tracker**: Time slot validation, conflict detection, schedule optimization

## Technologies Used

### Backend
- **FastAPI**: Modern Python web framework with async support
- **MongoDB**: NoSQL database with Motor async driver
- **Pydantic**: Data validation and serialization
- **PyPDF2**: PDF text extraction
- **python-docx**: DOCX document processing
- **scikit-learn**: Machine learning utilities
- **Requests**: HTTP client for external API calls

### Frontend
- **React**: JavaScript UI library
- **Axios**: HTTP client for API communication

### AI/ML Components
- **Natural Language Processing**: Skill extraction from CV text
- **Multi-criteria Decision Making**: Weighted scoring algorithm
- **Pattern Matching**: Regex-based information extraction
- **Fuzzy Matching**: Flexible skill and location matching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of an academic assignment for Information Retrieval and Web Analytics (IT 3041).
