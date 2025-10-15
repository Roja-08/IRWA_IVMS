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
        """Calculate skill match score using ML methods"""
        if not required_skills:
            return 0.8  # High score if no specific skills required
        
        if not volunteer_skills:
            return 0.2  # Low but not zero if volunteer has no skills
        
        try:
            # Import ML classifier
            from ml_classifier import MLTextClassifier
            ml_classifier = MLTextClassifier()
            
            volunteer_skill_names = [skill.get('name', '') for skill in volunteer_skills]
            
            # Use ML-enhanced skill matching
            ml_score = ml_classifier.enhanced_skill_matching(volunteer_skill_names, required_skills)
            
            return ml_score
            
        except Exception as e:
            # Fallback to original method if ML fails
            volunteer_skill_names = [skill.get('name', '').lower() for skill in volunteer_skills]
            required_skills_lower = [skill.lower() for skill in required_skills]
            
            matches = 0
            for req_skill in required_skills_lower:
                for vol_skill in volunteer_skill_names:
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
        """Calculate availability match score based on actual volunteer availability"""
        if not volunteer_availability:
            return 0.6  # Neutral if no availability specified
        
        # Handle different availability formats
        if isinstance(volunteer_availability, dict):
            availability_type = volunteer_availability.get('type', 'weekly')
            
            if availability_type == 'monthly':
                return self._calculate_monthly_availability_match(volunteer_availability, job)
            elif availability_type == 'weekly' and 'schedule' in volunteer_availability:
                volunteer_availability = volunteer_availability['schedule']
        
        # Weekly schedule matching
        if not volunteer_availability:
            return 0.6
        
        # Count available time slots and calculate total hours
        total_available_hours = 0
        available_days = 0
        
        for slot in volunteer_availability:
            if slot.get('status') == 'available' or slot.get('available', False):
                available_days += 1
                # Calculate hours if time slots are provided
                if 'start_time' in slot and 'end_time' in slot:
                    start_hour = int(slot['start_time'].split(':')[0])
                    end_hour = int(slot['end_time'].split(':')[0])
                    total_available_hours += max(0, end_hour - start_hour)
        
        # Job time commitment matching
        job_time_commitment = job.get('time_commitment', '').lower()
        
        # Score based on available days and hours
        day_score = min(available_days / 7.0, 1.0)  # Normalize to 0-1
        
        # Bonus for matching job time requirements
        time_bonus = 0
        if 'part-time' in job_time_commitment or 'flexible' in job_time_commitment:
            if available_days >= 2:  # At least 2 days available
                time_bonus = 0.2
        elif 'full-time' in job_time_commitment:
            if available_days >= 5:  # At least 5 days available
                time_bonus = 0.3
        elif 'weekend' in job_time_commitment:
            weekend_available = any(slot.get('day_of_week', -1) in [5, 6] for slot in volunteer_availability if slot.get('status') == 'available')
            if weekend_available:
                time_bonus = 0.4
        
        # Calculate final score
        base_score = day_score * 0.7  # 70% weight for general availability
        final_score = min(base_score + time_bonus, 1.0)
        
        return max(final_score, 0.1)  # Minimum score of 0.1
    
    def _calculate_monthly_availability_match(self, monthly_availability: Dict, job: Dict) -> float:
        """Calculate availability match for monthly commitment format"""
        hours_per_week = monthly_availability.get('hoursPerWeek', 10)
        preferred_days = monthly_availability.get('preferredDays', 'flexible')
        time_preference = monthly_availability.get('timePreference', 'flexible')
        
        job_time_commitment = job.get('time_commitment', '').lower()
        
        # Base score from hours commitment
        if hours_per_week >= 20:
            base_score = 1.0
        elif hours_per_week >= 15:
            base_score = 0.9
        elif hours_per_week >= 10:
            base_score = 0.8
        elif hours_per_week >= 5:
            base_score = 0.6
        else:
            base_score = 0.4
        
        # Adjust based on job requirements
        if 'part-time' in job_time_commitment and hours_per_week <= 15:
            base_score += 0.1
        elif 'full-time' in job_time_commitment and hours_per_week >= 20:
            base_score += 0.1
        elif 'weekend' in job_time_commitment and preferred_days == 'weekends':
            base_score += 0.2
        elif preferred_days == 'flexible':
            base_score += 0.1
        
        return min(base_score, 1.0)
    
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