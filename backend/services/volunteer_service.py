from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from bson import ObjectId
from models import VolunteerProfile, Skill, Availability
from database import get_database
from agents.event_matcher import EventMatcherAgent
from agents.availability_tracker import AvailabilityTrackerAgent

logger = logging.getLogger(__name__)

class VolunteerService:
    """Service for managing volunteer profiles and operations"""
    
    def __init__(self):
        self.db = None
        self.event_matcher = EventMatcherAgent()
        self.availability_tracker = AvailabilityTrackerAgent()
    
    async def _ensure_db_connection(self):
        if self.db is None:
            self.db = get_database()
    
    async def create_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new volunteer profile"""
        try:
            await self._ensure_db_connection()
            logger.info(f"Creating profile for {profile_data.get('name')}")
            
            # Convert skills to dict format if they are Skill objects
            if 'skills' in profile_data and profile_data['skills']:
                skills_data = []
                for skill in profile_data['skills']:
                    if hasattr(skill, 'dict'):
                        skills_data.append(skill.dict())
                    else:
                        skills_data.append(skill)
                profile_data['skills'] = skills_data
            
            # Create VolunteerProfile object
            profile = VolunteerProfile(**profile_data)
            
            # Insert into database
            result = await self.db.volunteer_profiles.insert_one(profile.dict(by_alias=True))
            
            if result.inserted_id:
                # Get the generated volunteer_id from the profile
                created_profile = await self.db.volunteer_profiles.find_one({"_id": result.inserted_id})
                volunteer_id = created_profile.get('volunteer_id')
                logger.info(f"Created profile with ID: {volunteer_id}")
                return {
                    "success": True,
                    "message": "Profile created successfully",
                    "profile_id": volunteer_id
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to create profile"
                }
                
        except Exception as e:
            logger.error(f"Error creating profile: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }
    
    async def update_profile(self, profile_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing volunteer profile"""
        try:
            await self._ensure_db_connection()
            
            # Remove None values and prepare update
            update_data = {k: v for k, v in update_data.items() if v is not None}
            update_data['updated_at'] = datetime.utcnow()
            
            result = await self.db.volunteer_profiles.update_one(
                {"_id": ObjectId(profile_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return {
                    "success": True,
                    "message": "Profile updated successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "Profile not found or no changes made"
                }
                
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }
    
    async def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get volunteer profile by volunteer_id"""
        try:
            await self._ensure_db_connection()
            
            profile = await self.db.volunteer_profiles.find_one({"volunteer_id": profile_id})
            
            if profile:
                profile['_id'] = str(profile['_id'])
                return profile
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting profile: {e}")
            return None
    
    async def find_matches(self, profile_id: str) -> Dict[str, Any]:
        """Find job matches for a volunteer"""
        try:
            logger.info(f"Finding matches for volunteer {profile_id}")
            
            # Use event matcher agent  
            matches = await self.event_matcher.process(profile_id)
            
            return {
                "success": True,
                "matches": matches.get('matches', []),
                "total_matches": matches.get('total', 0)
            }
            
        except Exception as e:
            logger.error(f"Error finding matches: {e}")
            return {
                "success": False,
                "matches": [],
                "total_matches": 0
            }
    
    async def update_availability(self, profile_id: str, availability_data: List[Dict]) -> Dict[str, Any]:
        """Update volunteer availability"""
        try:
            logger.info(f"Updating availability for volunteer {profile_id}")
            
            # Use availability tracker agent
            result = await self.availability_tracker.process(profile_id, availability_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error updating availability: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }
    
    async def get_availability(self, profile_id: str) -> Dict[str, Any]:
        """Get volunteer availability"""
        try:
            result = await self.availability_tracker.get_volunteer_availability(profile_id)
            return {
                "success": True,
                **result
            }
            
        except Exception as e:
            logger.error(f"Error getting availability: {e}")
            return {
                "success": False,
                "availability": [],
                "total_hours": 0
            }
    
    async def search_profiles(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Search volunteer profiles with filters"""
        try:
            await self._ensure_db_connection()
            
            # Build query
            query = {}
            
            if filters.get('skills'):
                query['skills.name'] = {"$in": filters['skills']}
            
            if filters.get('location'):
                query['location'] = {"$regex": filters['location'], "$options": "i"}
            
            if filters.get('availability_days'):
                query['availability'] = {
                    "$elemMatch": {
                        "day_of_week": {"$in": filters['availability_days']},
                        "status": "available"
                    }
                }
            
            # Execute query
            cursor = self.db.volunteer_profiles.find(query)
            profiles = await cursor.to_list(length=100)  # Limit to 100 results
            
            # Convert ObjectIds to strings
            for profile in profiles:
                profile['_id'] = str(profile['_id'])
            
            return {
                "success": True,
                "profiles": profiles,
                "total": len(profiles)
            }
            
        except Exception as e:
            logger.error(f"Error searching profiles: {e}")
            return {
                "success": False,
                "profiles": [],
                "total": 0
            }