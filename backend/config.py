import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGODB_URL = "mongodb+srv://volunteer:volunteerirwa@volunteer-irwa.jvvay25.mongodb.net/?retryWrites=true&w=majority&appName=volunteer-irwa"
DATABASE_NAME = "volunteer_matching"

# External API Configuration
VOLUNTEER_API_URL = "https://www.volunteerconnector.org/api/search/"

# FastAPI Configuration
API_HOST = "0.0.0.0"
API_PORT = 8000
