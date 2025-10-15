from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np
import re
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class MLTextClassifier:
    """Machine Learning text classifier for volunteer matching system"""
    
    def __init__(self):
        self.skill_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.job_categories = {
            'healthcare': ['medical', 'health', 'hospital', 'patient', 'care', 'nursing', 'doctor', 'clinic'],
            'education': ['teach', 'school', 'student', 'education', 'tutor', 'learning', 'academic', 'classroom'],
            'technology': ['software', 'programming', 'computer', 'web', 'development', 'coding', 'tech', 'digital'],
            'environment': ['environment', 'green', 'sustainability', 'conservation', 'climate', 'nature', 'eco'],
            'community': ['community', 'social', 'outreach', 'support', 'help', 'assistance', 'service', 'volunteer'],
            'elderly': ['elderly', 'senior', 'aging', 'retirement', 'older', 'geriatric', 'care'],
            'children': ['children', 'kids', 'youth', 'child', 'young', 'family', 'parenting', 'daycare']
        }
        
    def extract_skills_ml(self, cv_text: str) -> List[Dict[str, Any]]:
        """Extract skills using ML-based text analysis"""
        try:
            # Preprocess text
            text = self._preprocess_text(cv_text)
            
            # Skill patterns with ML confidence scoring
            skill_patterns = {
                'programming': r'\b(python|java|javascript|c\+\+|c#|php|ruby|go|rust|swift)\b',
                'web': r'\b(html|css|react|angular|vue|node|express|django|flask)\b',
                'database': r'\b(sql|mysql|postgresql|mongodb|oracle|sqlite|redis)\b',
                'cloud': r'\b(aws|azure|gcp|docker|kubernetes|terraform|jenkins)\b',
                'data': r'\b(pandas|numpy|tensorflow|pytorch|scikit|tableau|powerbi)\b',
                'soft_skills': r'\b(leadership|communication|teamwork|problem.solving|management)\b'
            }
            
            skills = []
            for category, pattern in skill_patterns.items():
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Calculate confidence based on context
                    confidence = self._calculate_skill_confidence(match, text)
                    level = self._classify_skill_level(match, text)
                    
                    skills.append({
                        'name': match.title(),
                        'level': level,
                        'category': category,
                        'confidence': confidence,
                        'years_experience': self._extract_experience_years(match, text)
                    })
            
            return skills
            
        except Exception as e:
            logger.error(f"Error in ML skill extraction: {e}")
            return []
    
    def classify_job_category(self, job_text: str) -> Dict[str, float]:
        """Classify job into categories using ML"""
        try:
            text = self._preprocess_text(job_text)
            category_scores = {}
            
            for category, keywords in self.job_categories.items():
                # Calculate TF-IDF similarity
                combined_text = [text, ' '.join(keywords)]
                tfidf_matrix = self.skill_vectorizer.fit_transform(combined_text)
                similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                category_scores[category] = float(similarity)
            
            return category_scores
            
        except Exception as e:
            logger.error(f"Error in job classification: {e}")
            return {}
    
    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts"""
        try:
            texts = [self._preprocess_text(text1), self._preprocess_text(text2)]
            tfidf_matrix = self.skill_vectorizer.fit_transform(texts)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0
    
    def enhanced_skill_matching(self, volunteer_skills: List[str], job_skills: List[str]) -> float:
        """Enhanced skill matching using semantic similarity"""
        if not volunteer_skills or not job_skills:
            return 0.0
        
        try:
            vol_text = ' '.join(volunteer_skills)
            job_text = ' '.join(job_skills)
            
            # Calculate semantic similarity
            semantic_score = self.calculate_semantic_similarity(vol_text, job_text)
            
            # Calculate exact matches
            vol_skills_lower = [skill.lower() for skill in volunteer_skills]
            job_skills_lower = [skill.lower() for skill in job_skills]
            
            exact_matches = len(set(vol_skills_lower) & set(job_skills_lower))
            exact_score = exact_matches / len(job_skills_lower)
            
            # Combine scores (70% semantic, 30% exact)
            final_score = (semantic_score * 0.7) + (exact_score * 0.3)
            
            return min(final_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error in enhanced skill matching: {e}")
            return 0.0
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for ML analysis"""
        if not text:
            return ""
        
        # Convert to lowercase and remove special characters
        text = re.sub(r'[^a-zA-Z0-9\s+#.]', ' ', text.lower())
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _calculate_skill_confidence(self, skill: str, text: str) -> float:
        """Calculate confidence score for extracted skill"""
        # Count occurrences
        occurrences = len(re.findall(rf'\b{re.escape(skill)}\b', text, re.IGNORECASE))
        
        # Check for context indicators
        context_indicators = ['experience', 'years', 'proficient', 'expert', 'skilled']
        context_score = sum(1 for indicator in context_indicators if indicator in text.lower())
        
        # Calculate confidence (0.0 to 1.0)
        confidence = min((occurrences * 0.3) + (context_score * 0.2), 1.0)
        return max(confidence, 0.1)  # Minimum confidence
    
    def _classify_skill_level(self, skill: str, text: str) -> str:
        """Classify skill level using ML heuristics"""
        text_lower = text.lower()
        
        # Expert indicators
        if any(word in text_lower for word in ['expert', 'senior', 'lead', 'architect', '5+ years', '10+ years']):
            return 'expert'
        
        # Advanced indicators
        elif any(word in text_lower for word in ['advanced', 'proficient', '3+ years', '4+ years']):
            return 'advanced'
        
        # Intermediate indicators
        elif any(word in text_lower for word in ['intermediate', 'experienced', '2+ years', '1+ years']):
            return 'intermediate'
        
        # Default to beginner
        else:
            return 'beginner'
    
    def _extract_experience_years(self, skill: str, text: str) -> int:
        """Extract years of experience for a skill"""
        # Look for patterns like "3 years", "5+ years"
        pattern = rf'{re.escape(skill)}.*?(\d+)\+?\s*years?'
        match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            return int(match.group(1))
        
        return 0