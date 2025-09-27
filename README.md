# Intelligent Volunteer Matching System

A web application that retrieves volunteer opportunities from external APIs and stores them in MongoDB for intelligent matching with volunteers.

## Project Structure

```
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI application entry point
│   ├── config.py           # Configuration settings
│   ├── database.py         # MongoDB connection setup
│   ├── models.py           # Pydantic models for data validation
│   ├── services/           # Business logic services
│   │   └── job_service.py  # Job retrieval and storage service
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── JobRetriever.js  # Job retrieval test component
│   │   └── App.js          # Main React component
│   └── package.json        # Node.js dependencies
└── README.md              # This file
```

## Features

- **Job Retrieval**: Fetches volunteer opportunities from volunteerconnector.org API
- **Data Storage**: Stores jobs in MongoDB with proper data validation
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **React Frontend**: User interface for testing and managing job retrieval
- **Error Handling**: Robust error handling and logging
- **Data Transformation**: Converts external API data to standardized format

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

## API Endpoints

### Backend API

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `POST /api/jobs/retrieve` - Retrieve jobs from external API and store in database
- `GET /api/jobs` - Get stored jobs with pagination
- `GET /api/jobs/count` - Get total count of stored jobs

### Example Usage

#### Retrieve Jobs from External API
```bash
curl -X POST "http://localhost:8000/api/jobs/retrieve" \
     -H "Content-Type: application/json" \
     -d '{"limit": 100}'
```

#### Get Stored Jobs
```bash
curl "http://localhost:8000/api/jobs?skip=0&limit=20"
```

#### Get Jobs Count
```bash
curl "http://localhost:8000/api/jobs/count"
```

## Database Configuration

The system uses MongoDB Atlas with the following connection string:
```
mongodb+srv://volunteer:volunteerirwa@volunteer-irwa.jvvay25.mongodb.net/?retryWrites=true&w=majority&appName=volunteer-irwa
```

Database name: `volunteer_matching`
Collection name: `volunteer_jobs`

## Data Model

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

## Testing the System

1. Start both backend and frontend servers
2. Open the React app in your browser
3. Click "Retrieve Jobs from API" to fetch jobs from volunteerconnector.org
4. Click "Fetch Stored Jobs" to view the stored jobs
5. Click "Get Jobs Count" to see the total number of jobs in the database

## Future Enhancements

This is the foundation for the Intelligent Volunteer Matching System. Future features will include:

- **Skill Profiler**: AI-powered skill extraction and matching
- **Event Matcher**: Intelligent matching algorithm
- **Availability Tracker**: Volunteer availability management
- **User Authentication**: Secure user management
- **Advanced Search**: Filtering and search capabilities
- **Recommendation Engine**: AI-powered job recommendations

## Technologies Used

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database with Motor async driver
- **Pydantic**: Data validation and serialization
- **Requests**: HTTP client for external API calls

### Frontend
- **React**: JavaScript UI library
- **Axios**: HTTP client for API communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of an academic assignment for Information Retrieval and Web Analytics (IT 3041).
