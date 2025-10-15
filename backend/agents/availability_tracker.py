from typing import Dict, List, Any
from datetime import datetime, timedelta
from .base_agent import BaseAgent
from models import Availability, AvailabilityStatus
from database import get_database
from ml_classifier import MLTextClassifier

class AvailabilityTrackerAgent(BaseAgent):
    """Agent responsible for tracking and managing volunteer availability"""
    
    def __init__(self):
        super().__init__("AvailabilityTracker")
        self.db = None
        self.ml_classifier = MLTextClassifier()
    
    async def _ensure_db_connection(self):
        if self.db is None:
            self.db = get_database()
    
    async def process(self, volunteer_id: str, availability_data: List[Dict]) -> Dict[str, Any]:
        """Process and update volunteer availability"""
        try:
            await self._ensure_db_connection()
            self.log_info(f"Processing availability for volunteer {volunteer_id}")
            
            # volunteer_id is already a string, no conversion needed
            
            # Validate and convert availability data
            validated_availability = []
            for av_data in availability_data:
                availability = self._validate_availability(av_data)
                if availability:
                    validated_availability.append(availability)
            
            # Update volunteer profile with new availability
            result = await self.db.volunteer_profiles.update_one(
                {"volunteer_id": volunteer_id},
                {"$set": {"availability": [av.dict() for av in validated_availability]}}
            )
            
            if result.modified_count > 0:
                self.log_info(f"Updated availability for volunteer {volunteer_id}")
                return {
                    "success": True,
                    "message": "Availability updated successfully",
                    "availability_slots": len(validated_availability)
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to update availability"
                }
                
        except Exception as e:
            self.log_error(f"Error processing availability: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }
    
    def _validate_availability(self, av_data: Dict) -> Availability:
        """Validate and create Availability object"""
        try:
            # Validate day of week
            day_of_week = av_data.get('day_of_week')
            if not isinstance(day_of_week, int) or day_of_week < 0 or day_of_week > 6:
                return None
            
            # Validate time format
            start_time = av_data.get('start_time')
            end_time = av_data.get('end_time')
            
            if not self._is_valid_time_format(start_time) or not self._is_valid_time_format(end_time):
                return None
            
            # Validate status
            status = av_data.get('status', AvailabilityStatus.AVAILABLE)
            if status not in [s.value for s in AvailabilityStatus]:
                status = AvailabilityStatus.AVAILABLE
            
            return Availability(
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time,
                status=AvailabilityStatus(status)
            )
            
        except Exception as e:
            self.log_error(f"Error validating availability: {e}")
            return None
    
    def _is_valid_time_format(self, time_str: str) -> bool:
        """Validate HH:MM time format"""
        try:
            if not time_str or ':' not in time_str:
                return False
            
            parts = time_str.split(':')
            if len(parts) != 2:
                return False
            
            hour, minute = int(parts[0]), int(parts[1])
            return 0 <= hour <= 23 and 0 <= minute <= 59
            
        except (ValueError, TypeError):
            return False
    
    async def get_volunteer_availability(self, volunteer_id: str) -> Dict[str, Any]:
        """Get current availability for a volunteer"""
        try:
            await self._ensure_db_connection()
            
            # volunteer_id is already a string, no conversion needed
            
            volunteer = await self.db.volunteer_profiles.find_one(
                {"volunteer_id": volunteer_id},
                {"availability": 1}
            )
            
            if not volunteer:
                return {"availability": [], "total_hours": 0}
            
            availability = volunteer.get('availability', [])
            total_hours = self._calculate_total_available_hours(availability)
            
            return {
                "availability": availability,
                "total_hours": total_hours,
                "available_days": len([av for av in availability if av.get('status') == 'available'])
            }
            
        except Exception as e:
            self.log_error(f"Error getting availability: {e}")
            return {"availability": [], "total_hours": 0}
    
    def _calculate_total_available_hours(self, availability: List[Dict]) -> float:
        """Calculate total available hours per week"""
        total_hours = 0
        
        for av in availability:
            if av.get('status') == 'available':
                start_time = av.get('start_time')
                end_time = av.get('end_time')
                
                if start_time and end_time:
                    hours = self._calculate_time_difference(start_time, end_time)
                    total_hours += hours
        
        return total_hours
    
    def _calculate_time_difference(self, start_time: str, end_time: str) -> float:
        """Calculate hours between two time strings"""
        try:
            start_parts = start_time.split(':')
            end_parts = end_time.split(':')
            
            start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
            end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])
            
            # Handle overnight shifts
            if end_minutes < start_minutes:
                end_minutes += 24 * 60
            
            return (end_minutes - start_minutes) / 60.0
            
        except Exception:
            return 0.0
    
    async def check_availability_conflicts(self, volunteer_id: str, job_schedule: Dict) -> Dict[str, Any]:
        """Check if volunteer availability conflicts with job schedule"""
        try:
            availability_data = await self.get_volunteer_availability(volunteer_id)
            availability = availability_data.get('availability', [])
            
            conflicts = []
            compatible_slots = []
            
            # Simple conflict checking - can be enhanced based on job schedule format
            for av in availability:
                if av.get('status') == 'busy':
                    conflicts.append(f"Day {av.get('day_of_week')} - {av.get('start_time')} to {av.get('end_time')}")
                else:
                    compatible_slots.append(f"Day {av.get('day_of_week')} - {av.get('start_time')} to {av.get('end_time')}")
            
            return {
                "has_conflicts": len(conflicts) > 0,
                "conflicts": conflicts,
                "compatible_slots": compatible_slots,
                "compatibility_score": len(compatible_slots) / max(len(availability), 1)
            }
            
        except Exception as e:
            self.log_error(f"Error checking conflicts: {e}")
            return {"has_conflicts": True, "conflicts": [], "compatible_slots": []}