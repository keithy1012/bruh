from pydantic import BaseModel, Field
from datetime import datetime

class SocialFeed(BaseModel):
    feed_id: str
    user_id: str
    username: str
    activity_type: str  # streak_milestone, mission_complete, level_up
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)
