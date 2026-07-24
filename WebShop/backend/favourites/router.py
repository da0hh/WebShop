from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from favourites.models import Favourite
from favourites.schemas import ReadFavourite, AddFavourite, RemoveFavourite

from database import get_db

router = APIRouter()

@router.post("/add-item", response_model=ReadFavourite)
async def add_item_to_favourite(payload: AddFavourite, db: AsyncSession = Depends(get_db)):
    in_favourite = await db.execute(select(Favourite).where(
        Favourite.item_id == payload.item_id,
        Favourite.user_id == payload.user_id
    ))

    existing = in_favourite.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()
        raise HTTPException(status_code=200, detail="Item removed from favorites")

    new_favourite = Favourite(
        user_id=payload.user_id,
        item_id=payload.item_id
    )

    db.add(new_favourite)
    await db.commit()
    await db.refresh(new_favourite)

    return ReadFavourite(
        favourite_id=new_favourite.favourite_id,
        user_id=new_favourite.user_id,
        item_id=new_favourite.item_id
    )

@router.post("/favourite-list/{user_id}", response_model=List[ReadFavourite])
async def all_favourite(user_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.scalars(select(Favourite).where(Favourite.user_id == user_id))

    return [
        ReadFavourite(
            favourite_id=fav.favourite_id,
            user_id=fav.user_id,
            item_id=fav.item_id
        )
        for fav in res.all()
    ]

@router.delete("/remove-favourite")
async def remove_favourite(payload: RemoveFavourite, db: AsyncSession = Depends(get_db)):
    in_favourite = await db.scalars(select(Favourite).where(Favourite.item_id == payload.item_id))

    await db.delete(in_favourite.first())
    await db.commit()

    return {"ok": True}