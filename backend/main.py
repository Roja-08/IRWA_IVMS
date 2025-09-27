from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from services.job_service import JobService
from models import JobRetrievalResponse
from database import connect_to_mongo, close_mongo_connection
from config import API_HOST, API_PORT

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

# Initialize job service
job_service = JobService()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
        log_level="info"
    )
