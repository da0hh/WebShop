from pydantic import BaseModel
from datetime import datetime

class ReadReview(BaseModel):
    review_id: int
    user_id: int
    item_id: int
    author: str
    body: str
    rating: int
    created_at: datetime

class CreateReview(BaseModel):
    user_id: int
    item_id: int
    author: str
    body: str
    rating: int

class DeleteReview(BaseModel):
    review_id: int
    user_id: int
    item_id: int