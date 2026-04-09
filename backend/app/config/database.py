from pymongo import MongoClient
import certifi
from app.config.settings import settings

client = MongoClient(
    settings.MONGO_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=20000,
    socketTimeoutMS=20000,
)

db = client["plc_ai_studio"]

projects_collection = db["projects"]
users_collection    = db["users"]