from typing import Dict, Any
import hashlib
from database import get_database

class AuthService:
    def __init__(self):
        self.db = None
    
    async def _ensure_db_connection(self):
        if self.db is None:
            self.db = get_database()
    
    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()
    
    async def signup(self, username: str, password: str) -> Dict[str, Any]:
        try:
            await self._ensure_db_connection()
            
            # Check if user exists
            existing_user = await self.db.users.find_one({"username": username})
            if existing_user:
                return {"success": False, "message": "Username already exists"}
            
            # Create new user
            user_data = {
                "username": username,
                "password": self._hash_password(password),
                "role": "user"
            }
            
            await self.db.users.insert_one(user_data)
            return {"success": True, "message": "User created successfully"}
            
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def login(self, username: str, password: str) -> Dict[str, Any]:
        try:
            await self._ensure_db_connection()
            
            # Default admins
            default_admins = {
                "admin": "admin123",
                "viviyan": "vivy123"
            }
            
            if username in default_admins and password == default_admins[username]:
                return {
                    "success": True,
                    "user": {"username": username, "role": "admin"}
                }
            
            # Check database users
            user = await self.db.users.find_one({"username": username})
            if user and user["password"] == self._hash_password(password):
                return {
                    "success": True,
                    "user": {
                        "username": username,
                        "role": user["role"]
                    }
                }
            
            return {"success": False, "message": "Invalid credentials"}
            
        except Exception as e:
            return {"success": False, "message": str(e)}