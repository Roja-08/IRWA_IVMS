import io
import logging
from typing import Dict, Any, Optional
from fastapi import UploadFile
import PyPDF2
import docx
from agents.skill_profiler import SkillProfilerAgent

logger = logging.getLogger(__name__)

class CVProcessorService:
    """Service for processing uploaded CV files"""
    
    def __init__(self):
        self.skill_profiler = SkillProfilerAgent()
        self.supported_formats = ['.pdf', '.docx', '.txt']
    
    async def process_cv(self, file: UploadFile) -> Dict[str, Any]:
        """Process uploaded CV file and extract information"""
        try:
            logger.info(f"Processing CV file: {file.filename}")
            
            # Validate file format
            if not self._is_supported_format(file.filename):
                return {
                    "success": False,
                    "message": f"Unsupported file format. Supported formats: {', '.join(self.supported_formats)}"
                }
            
            # Extract text from file
            text_content = await self._extract_text(file)
            if not text_content:
                return {
                    "success": False,
                    "message": "Could not extract text from the file"
                }
            
            # Process with skill profiler agent
            skill_analysis = await self.skill_profiler.process(text_content)
            
            # Extract additional information
            contact_info = self._extract_contact_info(text_content)
            experience_summary = self._extract_experience_summary(text_content)
            
            return {
                "success": True,
                "message": "CV processed successfully",
                "cv_text": text_content,
                "skills": skill_analysis.get('skills', []),
                "skill_count": skill_analysis.get('skill_count', 0),
                "categories_found": skill_analysis.get('categories_found', []),
                "contact_info": contact_info,
                "experience_summary": experience_summary,
                "filename": file.filename
            }
            
        except Exception as e:
            logger.error(f"Error processing CV: {e}")
            return {
                "success": False,
                "message": f"Error processing CV: {str(e)}"
            }
    
    def _is_supported_format(self, filename: str) -> bool:
        """Check if file format is supported"""
        if not filename:
            return False
        
        return any(filename.lower().endswith(fmt) for fmt in self.supported_formats)
    
    async def _extract_text(self, file: UploadFile) -> Optional[str]:
        """Extract text from uploaded file based on format"""
        try:
            content = await file.read()
            filename = file.filename.lower()
            
            if filename.endswith('.pdf'):
                return self._extract_from_pdf(content)
            elif filename.endswith('.docx'):
                return self._extract_from_docx(content)
            elif filename.endswith('.txt'):
                return content.decode('utf-8')
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return None
    
    def _extract_from_pdf(self, content: bytes) -> Optional[str]:
        """Extract text from PDF file"""
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting from PDF: {e}")
            return None
    
    def _extract_from_docx(self, content: bytes) -> Optional[str]:
        """Extract text from DOCX file"""
        try:
            doc_file = io.BytesIO(content)
            doc = docx.Document(doc_file)
            
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting from DOCX: {e}")
            return None
    
    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extract contact information from CV text"""
        import re
        
        contact_info = {}
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact_info['email'] = emails[0]
        
        # Extract phone number
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact_info['phone'] = ''.join(phones[0]) if isinstance(phones[0], tuple) else phones[0]
        
        return contact_info
    
    def _extract_experience_summary(self, text: str) -> str:
        """Extract a brief experience summary from CV"""
        lines = text.split('\n')
        
        # Look for summary/objective section
        summary_keywords = ['summary', 'objective', 'profile', 'about']
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in summary_keywords):
                # Take next few lines as summary
                summary_lines = []
                for j in range(i + 1, min(i + 5, len(lines))):
                    if lines[j].strip() and not lines[j].isupper():
                        summary_lines.append(lines[j].strip())
                    elif summary_lines:  # Stop if we hit an empty line after finding content
                        break
                
                if summary_lines:
                    return ' '.join(summary_lines)
        
        # If no summary section found, take first few meaningful lines
        meaningful_lines = []
        for line in lines[:10]:
            line = line.strip()
            if len(line) > 20 and not line.isupper():
                meaningful_lines.append(line)
                if len(meaningful_lines) >= 2:
                    break
        
        return ' '.join(meaningful_lines) if meaningful_lines else "No summary available"