from pydantic import BaseModel
from typing import Optional

class ItemCreate(BaseModel):
    name: str
    price: float
    seller_id: int

class ItemRead(BaseModel):
    item_id: int
    name: str
    price: float
    seller_id: Optional[int] = None
    shop_name: Optional[str] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None