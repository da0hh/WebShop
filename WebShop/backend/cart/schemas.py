from pydantic import BaseModel
from typing import Optional

class CartRead(BaseModel):
    cart_id: int
    user_id: int
    item_id: int
    quantity: int
    item_name: Optional[str] = None
    item_price: Optional[float] = None

class CartItemAdd(BaseModel):
    user_id: int
    item_id: int
    quantity: int = 1

class CartItemRemove(BaseModel):
    user_id: int
    item_id: int

class CartResponse(BaseModel):
    cart_id: int
    user_id: int
    items: list[CartRead]
    total: float