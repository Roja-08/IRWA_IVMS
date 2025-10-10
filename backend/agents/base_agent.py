from abc import ABC, abstractmethod
from typing import Any, Dict, List
import logging

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all agents in the multi-agent system"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"agent.{name}")
    
    @abstractmethod
    async def process(self, data: Any) -> Dict[str, Any]:
        """Process data and return results"""
        pass
    
    def log_info(self, message: str):
        self.logger.info(f"[{self.name}] {message}")
    
    def log_error(self, message: str):
        self.logger.error(f"[{self.name}] {message}")