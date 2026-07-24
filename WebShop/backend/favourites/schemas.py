from pydantic import BaseModel, Field
from typing import Literal

class ReadFavourite(BaseModel):
    favourite_id: int
    user_id: int
    item_id: int

class AddFavourite(BaseModel):
    user_id: int
    item_id: int

class RemoveFavourite(BaseModel):
    user_id: int
    item_id: int
