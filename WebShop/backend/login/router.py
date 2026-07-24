from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime
from passlib.context import CryptContext

from login.schemas import LoginRead, LoginInAcc, SignUp, ChangePassword, ChangeUsername, DeleteAccount
from login.models import Login
from database import get_db

router = APIRouter()

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

async def _get_account_or_404(username: str, db: AsyncSession) -> Login:
    account = await db.scalar(select(Login).where(Login.username == username))
    if not account:
        raise HTTPException(status_code=404, detail="User not found")
    return account

def verify_password(plain_password: str, hashed_password: str):
    if not pwd_context.verify(plain_password, hashed_password):
        raise HTTPException(status_code=403, detail="Invalid password")

@router.post("/sign-up", response_model=LoginRead)
async def sign_up(payload: SignUp, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(Login).where(Login.username == payload.username))

    if existing:
        raise HTTPException(status_code=409, detail="User with this username is already exist")

    if payload.seller and not payload.shop_name:
        raise HTTPException(status_code=400, detail="Shop name is required for sellers")

    hashed_password = pwd_context.hash(payload.password)
    new_account = Login(
        username=payload.username,
        hashed_password=hashed_password,
        date_registration=datetime.now(),
        seller=payload.seller,
        shop_name=payload.shop_name if payload.seller else None
    )

    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)

    return new_account

@router.post("/login", response_model=LoginRead)
async def login_in_acc(payload: LoginInAcc, db: AsyncSession = Depends(get_db)):
    account = await _get_account_or_404(payload.username, db)
    verify_password(payload.password, account.hashed_password)

    return account

@router.get("/user/{user_id}", response_model=LoginRead)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(Login, user_id)
    if user is None:
        raise HTTPException(detail="User did not found", status_code=400)
    return user

@router.post("/change-name", response_model=LoginRead)
async def edit_account_name(payload: ChangeUsername, db: AsyncSession = Depends(get_db)):
    user = await _get_account_or_404(payload.current_username, db)
    verify_password(payload.password, user.hashed_password)

    existing = await db.scalar(select(Login).where(Login.username == payload.new_username))
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")


    user.username = payload.new_username

    await db.commit()
    await db.refresh(user)

    return user

@router.post("/change-pass", response_model=LoginRead)
async def edit_account_password(payload: ChangePassword, account: LoginInAcc, db: AsyncSession = Depends(get_db)):
    user = await _get_account_or_404(payload.username, db)
    verify_password(payload.password, user.hashed_password)

    new_hashed_password = pwd_context.hash(payload.new_password)
    user.hashed_password = new_hashed_password

    await db.commit()
    await db.refresh(user)

    return user

@router.delete("/delete-acc")
async def delete_account(payload: DeleteAccount, db: AsyncSession = Depends(get_db)):
    acc = await db.get(Login, payload.user_id)
    if acc is None:
        raise HTTPException(detail="User did not find", status_code=400)

    verify_password(payload.password, acc.hashed_password)

    await db.delete(acc)
    await db.commit()

    return {"ok": True}