import requests
import logging
from typing import List, Dict, Any
from datetime import datetime
from models import VolunteerJob
from database import get_database
from config import VOLUNTEER_API_URL

logger = logging.getLogger(__name__)

class JobService:
    def __init__(self):
        self.api_url = VOLUNTEER_API_URL
        self.db = None
        self.jobs_collection = None

    async def _ensure_db_connection(self):
        """Ensure database connection is established"""
        if self.db is None:
            self.db = get_database()
            self.jobs_collection = self.db.volunteer_jobs

    async def fetch_jobs_from_api(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch volunteer jobs from the external API
        """
        try:
            logger.info(f"Fetching jobs from {self.api_url}")
            
            # Make request to the API
            response = requests.get(
                self.api_url,
                params={'limit': limit},
                timeout=30,
                headers={
                    'User-Agent': 'VolunteerMatchingSystem/1.0',
                    'Accept': 'application/json'
                }
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Handle different response formats
            if isinstance(data, dict):
                if 'results' in data:
                    jobs = data['results']
                elif 'data' in data:
                    jobs = data['data']
                elif 'jobs' in data:
                    jobs = data['jobs']
                else:
                    jobs = [data]  # Single job object
            elif isinstance(data, list):
                jobs = data
            else:
                logger.warning(f"Unexpected API response format: {type(data)}")
                jobs = []
            
            logger.info(f"Successfully fetched {len(jobs)} jobs from API")
            return jobs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching jobs from API: {e}")
            raise Exception(f"Failed to fetch jobs from API: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error fetching jobs: {e}")
            raise

    def transform_job_data(self, job_data: Dict[str, Any]) -> VolunteerJob:
        """
        Transform API job data to our VolunteerJob model
        """
        try:
            # Extract and clean the data
            title = job_data.get('title', job_data.get('name', 'Untitled Position'))
            description = job_data.get('description', job_data.get('summary', ''))
            
            # Handle organization - can be string or dict with 'name' field
            org_data = job_data.get('organization', job_data.get('org_name', ''))
            if isinstance(org_data, dict):
                organization = org_data.get('name', '')
            else:
                organization = str(org_data) if org_data else ''
            
            # Handle location - extract from audience or use location field
            location = job_data.get('location', job_data.get('city', ''))
            if not location:
                audience = job_data.get('audience', {})
                if isinstance(audience, dict):
                    regions = audience.get('regions', [])
                    if regions:
                        location = ', '.join(regions)
            
            # Handle skills - extract from activities or skills field
            skills_required = []
            
            # First try to get from activities field
            activities = job_data.get('activities', [])
            if isinstance(activities, list):
                for activity in activities:
                    if isinstance(activity, dict):
                        activity_name = activity.get('name', '')
                        if activity_name:
                            skills_required.append(activity_name)
            
            # If no activities, try skills field
            if not skills_required:
                skills_raw = job_data.get('skills', job_data.get('skills_required', ''))
                if isinstance(skills_raw, str):
                    skills_required = [skill.strip() for skill in skills_raw.split(',') if skill.strip()]
                elif isinstance(skills_raw, list):
                    skills_required = [str(skill).strip() for skill in skills_raw if skill]
            
            # Handle dates
            start_date = None
            end_date = None
            if job_data.get('start_date'):
                try:
                    start_date = datetime.fromisoformat(job_data['start_date'].replace('Z', '+00:00'))
                except:
                    pass
            
            if job_data.get('end_date'):
                try:
                    end_date = datetime.fromisoformat(job_data['end_date'].replace('Z', '+00:00'))
                except:
                    pass
            
            # Create VolunteerJob instance
            volunteer_job = VolunteerJob(
                title=title,
                description=description,
                organization=organization,
                location=location,
                skills_required=skills_required,
                time_commitment=job_data.get('duration', job_data.get('time_commitment', job_data.get('hours_per_week', ''))),
                start_date=start_date,
                end_date=end_date,
                contact_email=job_data.get('contact_email', job_data.get('email', '')),
                contact_phone=job_data.get('contact_phone', job_data.get('phone', '')),
                website=job_data.get('website', job_data.get('url', '')),
                external_id=str(job_data.get('id', job_data.get('_id', ''))),
                source="volunteerconnector.org"
            )
            
            return volunteer_job
            
        except Exception as e:
            logger.error(f"Error transforming job data: {e}")
            raise

    async def store_jobs(self, jobs: List[VolunteerJob]) -> int:
        """
        Store jobs in MongoDB
        """
        try:
            await self._ensure_db_connection()
            if not jobs:
                return 0
            
            # Convert to dict for MongoDB insertion
            jobs_dict = [job.dict(by_alias=True) for job in jobs]
            
            # Insert jobs, handling duplicates by external_id
            stored_count = 0
            for job_dict in jobs_dict:
                try:
                    # Check if job already exists by external_id
                    if job_dict.get('external_id'):
                        existing = await self.jobs_collection.find_one({
                            'external_id': job_dict['external_id'],
                            'source': job_dict['source']
                        })
                        
                        if existing:
                            # Update existing job
                            job_dict['updated_at'] = datetime.utcnow()
                            await self.jobs_collection.update_one(
                                {'_id': existing['_id']},
                                {'$set': job_dict}
                            )
                            logger.info(f"Updated existing job: {job_dict['title']}")
                        else:
                            # Insert new job
                            await self.jobs_collection.insert_one(job_dict)
                            stored_count += 1
                            logger.info(f"Stored new job: {job_dict['title']}")
                    else:
                        # Insert without external_id check
                        await self.jobs_collection.insert_one(job_dict)
                        stored_count += 1
                        logger.info(f"Stored new job: {job_dict['title']}")
                        
                except Exception as e:
                    logger.error(f"Error storing individual job: {e}")
                    continue
            
            logger.info(f"Successfully stored {stored_count} new jobs")
            return stored_count
            
        except Exception as e:
            logger.error(f"Error storing jobs: {e}")
            raise

    async def retrieve_and_store_jobs(self, limit: int = 100) -> Dict[str, Any]:
        """
        Main method to retrieve jobs from API and store in database
        """
        try:
            # Fetch jobs from API
            api_jobs = await self.fetch_jobs_from_api(limit)
            
            if not api_jobs:
                return {
                    'success': True,
                    'message': 'No jobs found in API response',
                    'jobs_retrieved': 0,
                    'jobs_stored': 0
                }
            
            # Transform jobs
            transformed_jobs = []
            errors = []
            
            for job_data in api_jobs:
                try:
                    volunteer_job = self.transform_job_data(job_data)
                    transformed_jobs.append(volunteer_job)
                except Exception as e:
                    error_msg = f"Error transforming job {job_data.get('id', 'unknown')}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            # Store jobs
            stored_count = await self.store_jobs(transformed_jobs)
            
            return {
                'success': True,
                'message': f'Successfully processed {len(api_jobs)} jobs',
                'jobs_retrieved': len(api_jobs),
                'jobs_stored': stored_count,
                'errors': errors if errors else None
            }
            
        except Exception as e:
            logger.error(f"Error in retrieve_and_store_jobs: {e}")
            return {
                'success': False,
                'message': f'Failed to retrieve and store jobs: {str(e)}',
                'jobs_retrieved': 0,
                'jobs_stored': 0,
                'errors': [str(e)]
            }
