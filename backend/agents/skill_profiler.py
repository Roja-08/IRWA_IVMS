import re
from typing import Dict, List, Any
from .base_agent import BaseAgent
from models import Skill, SkillLevel

class SkillProfilerAgent(BaseAgent):
    """Agent responsible for extracting and profiling skills from CV text"""
    
    def __init__(self):
        super().__init__("SkillProfiler")
        self.skill_patterns = {
            'programming': ['python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust'],
            'web': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask'],
            'database': ['mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'sql server'],
            'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
            'soft_skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management'],
            'languages': ['english', 'spanish', 'french', 'german', 'chinese', 'japanese'],
            'volunteer': ['community service', 'fundraising', 'event planning', 'teaching', 'mentoring']
        }
    
    async def process(self, cv_text: str) -> Dict[str, Any]:
        """Extract skills from CV text"""
        try:
            self.log_info("Starting skill extraction from CV")
            
            extracted_skills = []
            cv_lower = cv_text.lower()
            
            # Extract skills by category
            for category, skills in self.skill_patterns.items():
                for skill in skills:
                    if skill.lower() in cv_lower:
                        level = self._determine_skill_level(cv_text, skill)
                        years_exp = self._extract_years_experience(cv_text, skill)
                        
                        extracted_skills.append(Skill(
                            name=skill.title(),
                            level=level,
                            years_experience=years_exp,
                            verified=False
                        ))
            
            # Extract additional skills using patterns
            additional_skills = self._extract_pattern_based_skills(cv_text)
            extracted_skills.extend(additional_skills)
            
            # Remove duplicates
            unique_skills = {}
            for skill in extracted_skills:
                if skill.name not in unique_skills:
                    unique_skills[skill.name] = skill
            
            result = {
                'skills': list(unique_skills.values()),
                'skill_count': len(unique_skills),
                'categories_found': list(set([self._get_skill_category(skill.name) for skill in unique_skills.values()]))
            }
            
            self.log_info(f"Extracted {len(unique_skills)} unique skills")
            return result
            
        except Exception as e:
            self.log_error(f"Error extracting skills: {e}")
            return {'skills': [], 'skill_count': 0, 'categories_found': []}
    
    def _determine_skill_level(self, text: str, skill: str) -> SkillLevel:
        """Determine skill level based on context"""
        text_lower = text.lower()
        skill_lower = skill.lower()
        
        # Look for experience indicators
        expert_indicators = ['expert', 'senior', 'lead', 'architect', 'advanced']
        advanced_indicators = ['advanced', 'proficient', 'experienced']
        intermediate_indicators = ['intermediate', 'familiar', 'working knowledge']
        
        skill_context = self._get_skill_context(text_lower, skill_lower)
        
        for indicator in expert_indicators:
            if indicator in skill_context:
                return SkillLevel.EXPERT
        
        for indicator in advanced_indicators:
            if indicator in skill_context:
                return SkillLevel.ADVANCED
        
        for indicator in intermediate_indicators:
            if indicator in skill_context:
                return SkillLevel.INTERMEDIATE
        
        return SkillLevel.BEGINNER
    
    def _extract_years_experience(self, text: str, skill: str) -> int:
        """Extract years of experience for a skill"""
        skill_context = self._get_skill_context(text.lower(), skill.lower())
        
        # Look for patterns like "3 years", "5+ years", etc.
        year_patterns = [
            r'(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?',
            r'over\s+(\d+)\s*years?'
        ]
        
        for pattern in year_patterns:
            matches = re.findall(pattern, skill_context)
            if matches:
                return int(matches[0])
        
        return None
    
    def _get_skill_context(self, text: str, skill: str) -> str:
        """Get context around a skill mention"""
        skill_index = text.find(skill)
        if skill_index == -1:
            return ""
        
        start = max(0, skill_index - 100)
        end = min(len(text), skill_index + len(skill) + 100)
        return text[start:end]
    
    def _extract_pattern_based_skills(self, text: str) -> List[Skill]:
        """Extract skills using regex patterns"""
        skills = []
        
        # Pattern for "Skills:" section
        skills_section_pattern = r'skills?:?\s*([^\n]+(?:\n[^\n]+)*?)(?:\n\s*\n|\n[A-Z]|$)'
        matches = re.findall(skills_section_pattern, text, re.IGNORECASE | re.MULTILINE)
        
        for match in matches:
            # Split by common delimiters
            skill_items = re.split(r'[,;•\-\n]', match)
            for item in skill_items:
                item = item.strip()
                if len(item) > 2 and len(item) < 30:  # Reasonable skill name length
                    skills.append(Skill(
                        name=item.title(),
                        level=SkillLevel.INTERMEDIATE,
                        verified=False
                    ))
        
        return skills
    
    def _get_skill_category(self, skill_name: str) -> str:
        """Get category for a skill"""
        skill_lower = skill_name.lower()
        
        for category, skills in self.skill_patterns.items():
            if skill_lower in [s.lower() for s in skills]:
                return category
        
        return 'other'