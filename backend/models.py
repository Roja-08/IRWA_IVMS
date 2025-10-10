from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from typing import Optional, List, Any, Dict
from datetime import datetime, date
from bson import ObjectId
from enum import Enum
import uuid
import random
import string

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any) -> Any:
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, _core_schema: Any, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        return {"type": "string"}

class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    PARTIALLY_AVAILABLE = "partially_available"

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class VolunteerJob(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str
    description: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    skills_required: Optional[List[str]] = None
    time_commitment: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    external_id: Optional[str] = None
    source: str = "volunteerconnector.org"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Skill(BaseModel):
    name: str
    level: SkillLevel
    years_experience: Optional[int] = None
    verified: bool = False

class Availability(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    status: AvailabilityStatus = AvailabilityStatus.AVAILABLE

def generate_volunteer_id() -> str:
    """Generate a unique volunteer ID in format VOL-XXXXXXXX"""
    return f"VOL-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"

class VolunteerProfile(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    volunteer_id: str = Field(default_factory=generate_volunteer_id)
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: List[Skill] = []
    interests: List[str] = []
    availability: List[Availability] = []
    cv_text: Optional[str] = None
    cv_filename: Optional[str] = None
    experience_summary: Optional[str] = None
    preferred_time_commitment: Optional[str] = None
    max_distance: Optional[int] = None  # in km
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class JobMatch(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    volunteer_id: PyObjectId
    job_id: PyObjectId
    match_score: float  # 0.0 to 1.0
    skill_match_score: float
    availability_match_score: float
    location_match_score: float
    interest_match_score: float
    reasons: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CVUploadResponse(BaseModel):
    success: bool
    message: str
    extracted_skills: Optional[List[str]] = None
    profile_id: Optional[str] = None

class JobRetrievalResponse(BaseModel):
    success: bool
    message: str
    jobs_retrieved: int
    jobs_stored: int
    errors: Optional[List[str]] = None

class MatchingResponse(BaseModel):
    success: bool
    matches: List[Dict[str, Any]]
    total_matches: int
