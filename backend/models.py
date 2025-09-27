from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId

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
    external_id: Optional[str] = None  # ID from external API
    source: str = "volunteerconnector.org"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class JobRetrievalResponse(BaseModel):
    success: bool
    message: str
    jobs_retrieved: int
    jobs_stored: int
    errors: Optional[List[str]] = None
