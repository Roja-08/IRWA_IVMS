from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime
from typing import List, Dict, Any
from services.job_service import JobService
from services.cv_processor import CVProcessorService
from services.volunteer_service import VolunteerService
from models import JobRetrievalResponse, CVUploadResponse, MatchingResponse
from database import connect_to_mongo, close_mongo_connection
from config import API_HOST, API_PORT
from auth import AuthService
from agents.diversity_fairness import DiversityFairnessAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Volunteer Matching System...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down Volunteer Matching System...")
    await close_mongo_connection()

# Create FastAPI app
app = FastAPI(
    title="Intelligent Volunteer Matching System",
    description="A system for matching volunteers with opportunities using AI and NLP",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
job_service = JobService()
cv_processor = CVProcessorService()
volunteer_service = VolunteerService()
auth_service = AuthService()
diversity_agent = DiversityFairnessAgent()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Intelligent Volunteer Matching System API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

@app.post("/api/auth/login")
async def login(credentials: dict):
    """Login endpoint"""
    username = credentials.get('username')
    password = credentials.get('password')
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    result = await auth_service.login(username, password)
    
    if result['success']:
        return result
    else:
        raise HTTPException(status_code=401, detail=result['message'])

@app.post("/api/auth/signup")
async def signup(credentials: dict):
    """Signup endpoint"""
    username = credentials.get('username')
    password = credentials.get('password')
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    result = await auth_service.signup(username, password)
    
    if result['success']:
        return result
    else:
        raise HTTPException(status_code=400, detail=result['message'])

@app.post("/api/jobs/retrieve", response_model=JobRetrievalResponse)
async def retrieve_jobs(limit: int = 100):
    """
    Retrieve volunteer jobs from external API and store in database
    """
    try:
        logger.info(f"Starting job retrieval with limit: {limit}")
        
        result = await job_service.retrieve_and_store_jobs(limit)
        
        if result['success']:
            logger.info(f"Job retrieval completed successfully: {result['jobs_stored']} jobs stored")
        else:
            logger.error(f"Job retrieval failed: {result['message']}")
        
        return JobRetrievalResponse(**result)
        
    except Exception as e:
        logger.error(f"Unexpected error in retrieve_jobs endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api/jobs")
async def get_jobs(
    skip: int = 0, 
    limit: int = 100,
    search: str = None,
    location: str = None,
    skill: str = None,
    organization: str = None
):
    """
    Get stored volunteer jobs from database with filtering
    """
    try:
        from database import get_database
        db = get_database()
        jobs_collection = db.volunteer_jobs
        
        # Build filter query
        filter_query = {}
        
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"organization": {"$regex": search, "$options": "i"}}
            ]
        
        if location:
            filter_query["location"] = {"$regex": location, "$options": "i"}
        
        if skill:
            filter_query["skills_required"] = {"$regex": skill, "$options": "i"}
        
        if organization:
            filter_query["organization"] = {"$regex": organization, "$options": "i"}
        
        # Get total count for pagination
        total_count = await jobs_collection.count_documents(filter_query)
        
        # Get jobs with pagination and filtering
        cursor = jobs_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        jobs = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for JSON serialization
        for job in jobs:
            job['_id'] = str(job['_id'])
        
        return {
            "jobs": jobs,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total_count
        }
        
    except Exception as e:
        logger.error(f"Error getting jobs: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve jobs: {str(e)}"
        )

@app.get("/api/jobs/count")
async def get_jobs_count():
    """
    Get total count of stored jobs
    """
    try:
        from database import get_database
        db = get_database()
        jobs_collection = db.volunteer_jobs
        
        count = await jobs_collection.count_documents({})
        
        return {"total_jobs": count}
        
    except Exception as e:
        logger.error(f"Error getting jobs count: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get jobs count: {str(e)}"
        )

@app.get("/api/jobs/filters")
async def get_filter_options():
    """
    Get available filter options (locations, skills, organizations)
    """
    try:
        from database import get_database
        db = get_database()
        jobs_collection = db.volunteer_jobs
        
        # Get all jobs to extract unique values
        cursor = jobs_collection.find({}, {
            "location": 1,
            "skills_required": 1,
            "organization": 1
        })
        jobs = await cursor.to_list(length=None)
        
        # Extract unique values
        locations = set()
        skills = set()
        organizations = set()
        
        for job in jobs:
            if job.get("location"):
                locations.add(job["location"])
            if job.get("skills_required"):
                for skill in job["skills_required"]:
                    if skill:
                        skills.add(skill)
            if job.get("organization"):
                organizations.add(job["organization"])
        
        return {
            "locations": sorted(list(locations)),
            "skills": sorted(list(skills)),
            "organizations": sorted(list(organizations))
        }
        
    except Exception as e:
        logger.error(f"Error getting filter options: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get filter options: {str(e)}"
        )

# Volunteer Profile Endpoints
@app.post("/api/volunteers/upload-cv", response_model=CVUploadResponse)
async def upload_cv(
    file: UploadFile = File(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    location: str = Form(None),
    uploaded_by: str = Form(None),
    availability: str = Form(None)
):
    """Upload and process CV to create volunteer profile"""
    try:
        logger.info(f"Processing CV upload for {name}")
        
        # Process CV
        cv_result = await cv_processor.process_cv(file)
        
        if not cv_result['success']:
            raise HTTPException(status_code=400, detail=cv_result['message'])
        
        # Create volunteer profile
        profile_data = {
            'name': name,
            'email': email,
            'phone': phone,
            'location': location,
            'skills': cv_result['skills'],
            'cv_text': cv_result['cv_text'],
            'cv_filename': cv_result['filename'],
            'experience_summary': cv_result['experience_summary'],
            'uploaded_by': uploaded_by
        }
        
        # Add contact info from CV if not provided
        if not phone and cv_result['contact_info'].get('phone'):
            profile_data['phone'] = cv_result['contact_info']['phone']
        
        # Add availability if provided
        if availability:
            import json
            try:
                availability_data = json.loads(availability)
                profile_data['availability'] = availability_data
                logger.info(f"Added availability data: {len(availability_data)} time slots")
            except Exception as e:
                logger.warning(f"Failed to parse availability data: {e}")
        
        # Ensure uploaded_by is set
        if not uploaded_by:
            raise HTTPException(status_code=400, detail="User must be logged in to upload CV")
        
        logger.info(f"Creating profile with uploaded_by: {uploaded_by}")
        profile_result = await volunteer_service.create_profile(profile_data)
        
        if profile_result['success']:
            profile_id = profile_result['profile_id']
            
            # Process availability with availability tracker if provided
            if availability:
                try:
                    availability_data = json.loads(availability)
                    if availability_data:
                        from agents.availability_tracker import AvailabilityTrackerAgent
                        availability_tracker = AvailabilityTrackerAgent()
                        await availability_tracker.process(profile_id, availability_data)
                        logger.info(f"Processed availability for volunteer {profile_id}")
                except Exception as e:
                    logger.warning(f"Failed to process availability with tracker: {e}")
            
            # Generate user-friendly profile ID format
            friendly_id = f"VOL-{profile_id[:8].upper()}"
            
            return CVUploadResponse(
                success=True,
                message=f"CV processed successfully! Your unique Profile ID is: {friendly_id}",
                extracted_skills=[skill.name for skill in cv_result['skills']],
                profile_id=profile_id  # Keep original for API calls
            )
        else:
            raise HTTPException(status_code=500, detail=profile_result['message'])
            
    except Exception as e:
        logger.error(f"Error in CV upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteers/all")
async def get_all_volunteers(user_role: str = None, username: str = None):
    """Get volunteer profiles based on user role"""
    try:
        from database import get_database
        db = get_database()
        
        # Build query based on user role
        query = {}
        if user_role == "user" and username:
            query["uploaded_by"] = username
            logger.info(f"Filtering CVs for user: {username}, query: {query}")
        
        cursor = db.volunteer_profiles.find(query, {
            "name": 1, "email": 1, "location": 1, 
            "skills": 1, "created_at": 1, "cv_filename": 1, "volunteer_id": 1, "uploaded_by": 1
        })
        profiles = await cursor.to_list(length=100)
        
        # Convert ObjectIds to strings
        for profile in profiles:
            profile['_id'] = str(profile['_id'])
        
        logger.info(f"Found {len(profiles)} profiles for query: {query}")
        return {
            "success": True,
            "profiles": profiles,
            "total": len(profiles)
        }
        
    except Exception as e:
        logger.error(f"Error getting volunteers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteers/{profile_id}")
async def get_volunteer_profile(profile_id: str):
    """Get volunteer profile by ID"""
    try:
        profile = await volunteer_service.get_profile(profile_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return profile
        
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/volunteers/{profile_id}")
async def update_volunteer_profile(profile_id: str, update_data: Dict[str, Any]):
    """Update volunteer profile"""
    try:
        result = await volunteer_service.update_profile(profile_id, update_data)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['message'])
            
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/volunteers/{profile_id}/availability")
async def update_availability(profile_id: str, availability_data: List[Dict[str, Any]]):
    """Update volunteer availability"""
    try:
        result = await volunteer_service.update_availability(profile_id, availability_data)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['message'])
            
    except Exception as e:
        logger.error(f"Error updating availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteers/{profile_id}/availability")
async def get_availability(profile_id: str):
    """Get volunteer availability"""
    try:
        result = await volunteer_service.get_availability(profile_id)
        return result
        
    except Exception as e:
        logger.error(f"Error getting availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteers/{profile_id}/matches", response_model=MatchingResponse)
async def get_job_matches(profile_id: str, apply_diversity: bool = False):
    """Get job matches for a volunteer using AI matching with optional diversity filters"""
    try:
        logger.info(f"Finding matches for volunteer {profile_id}")
        
        result = await volunteer_service.find_matches(profile_id)
        
        if result['success'] and apply_diversity:
            try:
                diversity_result = await diversity_agent.process(
                    job_id="general_matching", 
                    candidate_matches=result['matches']
                )
                
                if diversity_result['success']:
                    result['matches'] = diversity_result['filtered_matches']
            except Exception as e:
                logger.warning(f"Diversity filtering failed: {e}")
        
        if result['success']:
            return MatchingResponse(
                success=True,
                matches=result['matches'],
                total_matches=result['total_matches']
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to find matches")
            
    except Exception as e:
        logger.error(f"Error finding matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.delete("/api/volunteers/{profile_id}")
async def delete_volunteer_profile(profile_id: str):
    """Delete volunteer profile"""
    try:
        result = await volunteer_service.delete_profile(profile_id)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=404, detail=result['message'])
            
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/volunteers")
async def search_volunteers(
    skills: str = None,
    location: str = None,
    availability_days: str = None
):
    """Search volunteers with filters"""
    try:
        filters = {}
        
        if skills:
            filters['skills'] = [s.strip() for s in skills.split(',')]
        
        if location:
            filters['location'] = location
        
        if availability_days:
            filters['availability_days'] = [int(d) for d in availability_days.split(',')]
        
        result = await volunteer_service.search_profiles(filters)
        return result
        
    except Exception as e:
        logger.error(f"Error searching volunteers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
        log_level="info"
    )
