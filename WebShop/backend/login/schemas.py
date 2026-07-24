from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class SignUp(BaseModel):
    username: str
    password: str
    seller: bool = False
    shop_name: Optional[str] = None


class LoginInAcc(BaseModel):
    username: str
    password: str


class LoginRead(BaseModel):
    user_id: int
    username: str
    date_registration: datetime
    seller: bool
    shop_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChangePassword(BaseModel):
    username: str
    password: str
    new_password: str


class ChangeUsername(BaseModel):
    current_username: str
    password: str
    new_username: str


class DeleteAccount(BaseModel):
    user_id: int
    password: str