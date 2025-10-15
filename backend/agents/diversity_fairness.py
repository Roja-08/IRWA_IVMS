from typing import Dict, List, Any
import logging
from datetime import datetime, timedelta
from .base_agent import BaseAgent
from database import get_database
from ml_classifier import MLTextClassifier

logger = logging.getLogger(__name__)

class DiversityFairnessAgent(BaseAgent):
    """Agent for ensuring diversity and fairness in volunteer assignments"""
    
    def __init__(self):
        super().__init__("Diversity & Fairness Agent")
        self.agent_name = "Diversity & Fairness Agent"
        self.ml_classifier = MLTextClassifier()
    
    async def process(self, job_id: str, candidate_matches: List[Dict]) -> Dict[str, Any]:
        """Apply diversity and fairness filters to candidate matches"""
        try:
            logger.info(f"Applying diversity filters for job {job_id}")
            
            # Get job assignment history
            assignment_history = await self._get_assignment_history()
            
            # Apply diversity scoring
            diverse_matches = await self._apply_diversity_scoring(
                candidate_matches, assignment_history
            )
            
            # Apply fairness filters
            fair_matches = await self._apply_fairness_filters(
                diverse_matches, assignment_history
            )
            
            return {
                "success": True,
                "filtered_matches": fair_matches,
                "diversity_metrics": await self._calculate_diversity_metrics(fair_matches)
            }
            
        except Exception as e:
            logger.error(f"Error in diversity fairness processing: {e}")
            return {"success": False, "error": str(e)}
    
    async def _get_assignment_history(self) -> List[Dict]:
        """Get recent volunteer assignment history"""
        try:
            await self._ensure_db_connection()
            
            # Get assignments from last 6 months
            cutoff_date = datetime.utcnow() - timedelta(days=180)
            
            cursor = self.db.volunteer_assignments.find({
                "assigned_date": {"$gte": cutoff_date}
            })
            
            return await cursor.to_list(length=1000)
            
        except Exception as e:
            logger.error(f"Error getting assignment history: {e}")
            return []
    
    async def _apply_diversity_scoring(self, matches: List[Dict], history: List[Dict]) -> List[Dict]:
        """Apply diversity scoring based on demographics and skills"""
        try:
            # Count recent assignments by volunteer
            assignment_counts = {}
            for assignment in history:
                vol_id = assignment.get('volunteer_id')
                assignment_counts[vol_id] = assignment_counts.get(vol_id, 0) + 1
            
            # Apply diversity boost/penalty
            for match in matches:
                vol_id = match.get('volunteer_id')
                recent_assignments = assignment_counts.get(vol_id, 0)
                
                # Penalty for frequently assigned volunteers
                if recent_assignments > 3:
                    match['diversity_penalty'] = 0.2
                    match['match_score'] *= 0.8
                elif recent_assignments == 0:
                    match['diversity_boost'] = 0.1
                    match['match_score'] *= 1.1
                
                # Add diversity score
                match['diversity_score'] = max(0, 1 - (recent_assignments * 0.1))
            
            return matches
            
        except Exception as e:
            logger.error(f"Error applying diversity scoring: {e}")
            return matches
    
    async def _apply_fairness_filters(self, matches: List[Dict], history: List[Dict]) -> List[Dict]:
        """Apply fairness filters to prevent over-assignment"""
        try:
            # Get volunteers assigned in last 30 days
            recent_cutoff = datetime.utcnow() - timedelta(days=30)
            recently_assigned = set()
            
            for assignment in history:
                if assignment.get('assigned_date', datetime.min) >= recent_cutoff:
                    recently_assigned.add(assignment.get('volunteer_id'))
            
            # Separate recent and new volunteers
            new_volunteers = []
            experienced_volunteers = []
            
            for match in matches:
                vol_id = match.get('volunteer_id')
                if vol_id in recently_assigned:
                    experienced_volunteers.append(match)
                else:
                    new_volunteers.append(match)
            
            # Prioritize new volunteers (70% of slots)
            # Keep experienced volunteers (30% of slots)
            total_matches = len(matches)
            new_volunteer_slots = int(total_matches * 0.7)
            
            # Sort by match score
            new_volunteers.sort(key=lambda x: x.get('match_score', 0), reverse=True)
            experienced_volunteers.sort(key=lambda x: x.get('match_score', 0), reverse=True)
            
            # Combine with fairness priority
            fair_matches = (
                new_volunteers[:new_volunteer_slots] + 
                experienced_volunteers[:total_matches - new_volunteer_slots]
            )
            
            # Add fairness flags
            for match in fair_matches:
                vol_id = match.get('volunteer_id')
                match['is_new_volunteer'] = vol_id not in recently_assigned
                match['fairness_priority'] = 'high' if vol_id not in recently_assigned else 'normal'
            
            return fair_matches
            
        except Exception as e:
            logger.error(f"Error applying fairness filters: {e}")
            return matches
    
    async def _calculate_diversity_metrics(self, matches: List[Dict]) -> Dict[str, Any]:
        """Calculate diversity metrics for the filtered matches"""
        try:
            if not matches:
                return {}
            
            total_matches = len(matches)
            new_volunteers = sum(1 for m in matches if m.get('is_new_volunteer', False))
            experienced_volunteers = total_matches - new_volunteers
            
            avg_diversity_score = sum(m.get('diversity_score', 0) for m in matches) / total_matches
            
            return {
                "total_matches": total_matches,
                "new_volunteers": new_volunteers,
                "experienced_volunteers": experienced_volunteers,
                "new_volunteer_percentage": (new_volunteers / total_matches) * 100,
                "average_diversity_score": round(avg_diversity_score, 2),
                "fairness_applied": True
            }
            
        except Exception as e:
            logger.error(f"Error calculating diversity metrics: {e}")
            return {}
    
    async def record_assignment(self, volunteer_id: str, job_id: str) -> Dict[str, Any]:
        """Record a volunteer assignment for future diversity tracking"""
        try:
            await self._ensure_db_connection()
            
            assignment_record = {
                "volunteer_id": volunteer_id,
                "job_id": job_id,
                "assigned_date": datetime.utcnow(),
                "created_by_agent": self.agent_name
            }
            
            result = await self.db.volunteer_assignments.insert_one(assignment_record)
            
            return {
                "success": True,
                "assignment_id": str(result.inserted_id),
                "message": "Assignment recorded for diversity tracking"
            }
            
        except Exception as e:
            logger.error(f"Error recording assignment: {e}")
            return {"success": False, "error": str(e)}