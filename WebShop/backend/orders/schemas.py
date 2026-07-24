from pydantic import BaseModel
from items.models import Item

from typing import List
from datetime import datetime

class ReadOrder(BaseModel):
    order_id: int
    user_id: int
    item_ids: List[int]
    total: float
    status: str
    ordered_at: datetime

class CreateOrder(BaseModel):
    user_id: int
    order_items: List[int]

class CancelOrder(BaseModel):
    user_id: int
    order_id: int