#!/usr/bin/env python3
"""
Test script for the Intelligent Volunteer Matching System
Demonstrates the multi-agent architecture functionality
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from agents.skill_profiler import SkillProfilerAgent
from agents.event_matcher import EventMatcherAgent
from agents.availability_tracker import AvailabilityTrackerAgent

async def test_skill_profiler():
    """Test the Skill Profiler Agent"""
    print("=" * 50)
    print("TESTING SKILL PROFILER AGENT")
    print("=" * 50)
    
    agent = SkillProfilerAgent()
    
    # Sample CV text
    cv_text = """
    John Doe
    Software Developer
    john.doe@email.com
    +1-555-0123
    
    EXPERIENCE SUMMARY
    Experienced software developer with 5+ years in web development.
    Strong background in Python, JavaScript, and database management.
    
    SKILLS
    - Python (Advanced, 5 years)
    - JavaScript (Intermediate, 3 years)
    - React (Intermediate, 2 years)
    - MongoDB (Beginner, 1 year)
    - Project Management
    - Team Leadership
    - Communication
    
    EXPERIENCE
    Senior Developer at Tech Corp (2020-2024)
    - Led team of 5 developers
    - Developed web applications using Python and React
    - Managed MongoDB databases
    
    VOLUNTEER EXPERIENCE
    - Community service at local shelter
    - Teaching programming to kids
    - Event planning for charity fundraisers
    """
    
    result = await agent.process(cv_text)
    
    print(f"Skills extracted: {result['skill_count']}")
    print(f"Categories found: {', '.join(result['categories_found'])}")
    print("\nDetailed skills:")
    for skill in result['skills'][:10]:  # Show first 10 skills
        print(f"  - {skill.name}: {skill.level.value} ({skill.years_experience} years)" if skill.years_experience else f"  - {skill.name}: {skill.level.value}")
    
    return result

async def test_availability_tracker():
    """Test the Availability Tracker Agent"""
    print("\n" + "=" * 50)
    print("TESTING AVAILABILITY TRACKER AGENT")
    print("=" * 50)
    
    agent = AvailabilityTrackerAgent()
    
    # Sample availability data
    availability_data = [
        {
            "day_of_week": 1,  # Monday
            "start_time": "09:00",
            "end_time": "17:00",
            "status": "available"
        },
        {
            "day_of_week": 3,  # Wednesday
            "start_time": "14:00",
            "end_time": "18:00",
            "status": "available"
        },
        {
            "day_of_week": 5,  # Friday
            "start_time": "10:00",
            "end_time": "16:00",
            "status": "partially_available"
        }
    ]
    
    # Test validation (without database)
    validated_slots = []
    for av_data in availability_data:
        availability = agent._validate_availability(av_data)
        if availability:
            validated_slots.append(availability)
    
    print(f"Validated {len(validated_slots)} availability slots:")
    for slot in validated_slots:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        print(f"  - {days[slot.day_of_week]}: {slot.start_time} - {slot.end_time} ({slot.status.value})")
    
    # Test time calculation
    total_hours = agent._calculate_total_available_hours([slot.dict() for slot in validated_slots])
    print(f"\nTotal available hours per week: {total_hours}")
    
    return validated_slots

def test_event_matcher_logic():
    """Test Event Matcher logic (without database)"""
    print("\n" + "=" * 50)
    print("TESTING EVENT MATCHER AGENT LOGIC")
    print("=" * 50)
    
    agent = EventMatcherAgent()
    
    # Sample volunteer profile
    volunteer = {
        'skills': [
            {'name': 'Python', 'level': 'advanced'},
            {'name': 'Teaching', 'level': 'intermediate'},
            {'name': 'Project Management', 'level': 'beginner'}
        ],
        'location': 'New York, NY',
        'interests': ['education', 'technology', 'community service'],
        'availability': [
            {'day_of_week': 1, 'start_time': '09:00', 'end_time': '17:00', 'status': 'available'},
            {'day_of_week': 3, 'start_time': '14:00', 'end_time': '18:00', 'status': 'available'}
        ]
    }
    
    # Sample job
    job = {
        'title': 'Python Programming Tutor',
        'description': 'Teach Python programming to high school students',
        'organization': 'Code for Community',
        'location': 'New York, NY',
        'skills_required': ['Python', 'Teaching', 'Communication']
    }
    
    # Test individual matching components
    skill_score = agent._calculate_skill_match(volunteer['skills'], job['skills_required'])
    location_score = agent._calculate_location_match(volunteer['location'], job['location'])
    availability_score = agent._calculate_availability_match(volunteer['availability'], job)
    interest_score = agent._calculate_interest_match(volunteer['interests'], job)
    
    # Calculate total score
    total_score = (
        skill_score * 0.4 +
        location_score * 0.25 +
        availability_score * 0.2 +
        interest_score * 0.15
    )
    
    print(f"Job: {job['title']}")
    print(f"Organization: {job['organization']}")
    print(f"\nMatch Scores:")
    print(f"  Skills: {skill_score:.2f} (40% weight)")
    print(f"  Location: {location_score:.2f} (25% weight)")
    print(f"  Availability: {availability_score:.2f} (20% weight)")
    print(f"  Interest: {interest_score:.2f} (15% weight)")
    print(f"\nTotal Match Score: {total_score:.2f} ({total_score*100:.1f}%)")
    
    # Generate reasons
    reasons = agent._generate_match_reasons(skill_score, location_score, availability_score, interest_score)
    if reasons:
        print(f"\nMatch Reasons:")
        for reason in reasons:
            print(f"  - {reason}")
    
    return total_score

async def main():
    """Run all tests"""
    print("INTELLIGENT VOLUNTEER MATCHING SYSTEM")
    print("Multi-Agent Architecture Test Suite")
    print("=" * 60)
    
    try:
        # Test Skill Profiler Agent
        skill_result = await test_skill_profiler()
        
        # Test Availability Tracker Agent
        availability_result = await test_availability_tracker()
        
        # Test Event Matcher Agent Logic
        match_score = test_event_matcher_logic()
        
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✓ Skill Profiler: Extracted {skill_result['skill_count']} skills")
        print(f"✓ Availability Tracker: Validated {len(availability_result)} time slots")
        print(f"✓ Event Matcher: Generated {match_score*100:.1f}% match score")
        print("\n✅ All agents functioning correctly!")
        print("\nNext steps:")
        print("1. Start the backend server: python backend/main.py")
        print("2. Start the frontend server: cd frontend && npm start")
        print("3. Upload a CV and test the full system")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())