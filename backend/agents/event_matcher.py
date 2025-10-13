from typing import Dict, List, Any
from .base_agent import BaseAgent
from models import VolunteerProfile, VolunteerJob, JobMatch
from database import get_database
import math

class EventMatcherAgent(BaseAgent):
    """Agent responsible for matching volunteers with job opportunities"""
    
    def __init__(self):
        super().__init__("EventMatcher")
        self.db = None
    
    async def _ensure_db_connection(self):
        if self.db is None:
            self.db = get_database()
    
    async def process(self, volunteer_id) -> Dict[str, Any]:
        """Find matching jobs for a volunteer"""
        try:
            await self._ensure_db_connection()
            self.log_info(f"Finding matches for volunteer {volunteer_id}")
            
            # volunteer_id is already a string, no conversion needed
            
            # Get volunteer profile by volunteer_id
            volunteer = await self.db.volunteer_profiles.find_one({"volunteer_id": volunteer_id})
            if not volunteer:
                return {"matches": [], "total": 0}
            
            # Get all available jobs
            jobs_cursor = self.db.volunteer_jobs.find({})
            jobs = await jobs_cursor.to_list(length=None)
            
            matches = []
            for job in jobs:
                match_score = await self._calculate_match_score(volunteer, job)
                if match_score['total_score'] > 0.1:  # Lower threshold
                    # Convert ObjectId to string for JSON serialization
                    job['_id'] = str(job['_id'])
                    matches.append({
                        'job': job,
                        'match_score': match_score['total_score'],
                        'skill_match': match_score['skill_score'],
                        'location_match': match_score['location_score'],
                        'availability_match': match_score['availability_score'],
                        'interest_match': match_score['interest_score'],
                        'reasons': match_score['reasons']
                    })
            
            # Sort by match score
            matches.sort(key=lambda x: x['match_score'], reverse=True)
            
            self.log_info(f"Found {len(matches)} matches out of {len(jobs)} jobs for volunteer")
            self.log_info(f"Volunteer has {len(volunteer.get('skills', []))} skills")
            return {"matches": matches[:20], "total": len(matches)}  # Top 20 matches
            
        except Exception as e:
            self.log_error(f"Error finding matches: {e}")
            return {"matches": [], "total": 0}
    
    async def _calculate_match_score(self, volunteer: Dict, job: Dict) -> Dict[str, Any]:
        """Calculate comprehensive match score between volunteer and job"""
        
        # Skill matching (40% weight)
        skill_score = self._calculate_skill_match(volunteer.get('skills', []), job.get('skills_required', []))
        
        # Location matching (25% weight)
        location_score = self._calculate_location_match(volunteer.get('location'), job.get('location'))
        
        # Availability matching (20% weight)
        availability_score = self._calculate_availability_match(volunteer.get('availability', []), job)
        
        # Interest matching (15% weight)
        interest_score = self._calculate_interest_match(volunteer.get('interests', []), job)
        
        # Calculate weighted total
        total_score = (
            skill_score * 0.4 +
            location_score * 0.25 +
            availability_score * 0.2 +
            interest_score * 0.15
        )
        
        # Generate reasons
        reasons = self._generate_match_reasons(skill_score, location_score, availability_score, interest_score)
        
        return {
            'total_score': total_score,
            'skill_score': skill_score,
            'location_score': location_score,
            'availability_score': availability_score,
            'interest_score': interest_score,
            'reasons': reasons
        }
    
    def _calculate_skill_match(self, volunteer_skills: List[Dict], required_skills: List[str]) -> float:
        """Calculate skill match score"""
        if not required_skills:
            return 0.8  # High score if no specific skills required
        
        if not volunteer_skills:
            return 0.2  # Low but not zero if volunteer has no skills
        
        volunteer_skill_names = [skill.get('name', '').lower() for skill in volunteer_skills]
        required_skills_lower = [skill.lower() for skill in required_skills]
        
        matches = 0
        for req_skill in required_skills_lower:
            for vol_skill in volunteer_skill_names:
                # More flexible matching
                if (req_skill in vol_skill or vol_skill in req_skill or 
                    any(word in vol_skill for word in req_skill.split()) or
                    any(word in req_skill for word in vol_skill.split())):
                    matches += 1
                    break
        
        return min(matches / len(required_skills), 1.0)
    
    def _calculate_location_match(self, volunteer_location: str, job_location: str) -> float:
        """Calculate location match score"""
        if not volunteer_location and not job_location:
            return 0.8  # Both unspecified - good match
        
        if not volunteer_location or not job_location:
            return 0.6  # One unspecified - neutral
        
        vol_loc = volunteer_location.lower()
        job_loc = job_location.lower()
        
        # Exact match
        if vol_loc == job_loc:
            return 1.0
        
        # Check for common words
        vol_words = set(vol_loc.replace(',', ' ').split())
        job_words = set(job_loc.replace(',', ' ').split())
        
        common_words = vol_words.intersection(job_words)
        if common_words:
            return 0.8
        
        return 0.4  # Different locations but still possible
    
    def _calculate_availability_match(self, volunteer_availability: List[Dict], job: Dict) -> float:
        """Calculate availability match score"""
        if not volunteer_availability:
            return 0.5  # Neutral if no availability specified
        
        # Simple availability check - can be enhanced with actual time matching
        available_days = len([av for av in volunteer_availability if av.get('status') == 'available'])
        
        if available_days >= 3:
            return 1.0
        elif available_days >= 1:
            return 0.7
        else:
            return 0.3
    
    def _calculate_interest_match(self, volunteer_interests: List[str], job: Dict) -> float:
        """Calculate interest match score"""
        if not volunteer_interests:
            return 0.5
        
        job_text = f"{job.get('title', '')} {job.get('description', '')} {job.get('organization', '')}".lower()
        interest_matches = 0
        
        for interest in volunteer_interests:
            if interest.lower() in job_text:
                interest_matches += 1
        
        return min(interest_matches / len(volunteer_interests), 1.0)
    
    def _generate_match_reasons(self, skill_score: float, location_score: float, 
                              availability_score: float, interest_score: float) -> List[str]:
        """Generate human-readable reasons for the match"""
        reasons = []
        
        if skill_score > 0.5:
            reasons.append("Good skill match")
        elif skill_score > 0.2:
            reasons.append("Some relevant skills")
        
        if location_score > 0.6:
            reasons.append("Good location match")
        elif location_score > 0.4:
            reasons.append("Acceptable location")
        
        if availability_score > 0.5:
            reasons.append("Good availability")
        
        if interest_score > 0.4:
            reasons.append("Interest alignment")
        
        if not reasons:
            reasons.append("General volunteer opportunity")
        
        return reasons