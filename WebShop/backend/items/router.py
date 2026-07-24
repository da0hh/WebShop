from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from items.models import Item
from items.schemas import ItemCreate, ItemRead, ItemUpdate

from login.models import Login
from database import get_db
from typing import List

router = APIRouter()

@router.post("/create-item", response_model=ItemRead)
async def create_item(payload: ItemCreate, db: AsyncSession = Depends(get_db)):
    user = await db.get(Login, payload.seller_id)

    if not user or not user.seller:
        raise HTTPException(status_code=403, detail="Only sellers can create items")

    item = Item(
        name=payload.name,
        price=payload.price,
        seller_id=payload.seller_id,
    )

    db.add(item)
    await db.commit()
    await db.refresh(item)

    seller = await db.get(Login, item.seller_id) if item.seller_id else None

    return ItemRead(
        item_id=item.item_id,
        name=item.name,
        price=item.price,
        seller_id=item.seller_id,
        shop_name=seller.shop_name if seller else None
    )

@router.post("/update-item/{item_id}", response_model=ItemRead)
async def update_items(item_id: int, payload: ItemUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.name:
        item.name = payload.name
    if payload.price is not None:
        item.price = payload.price

    await db.commit()
    await db.refresh(item)

    return item

@router.get("/", response_model=List[ItemRead])
async def get_all_items(db: AsyncSession = Depends(get_db)):
    items_result = await db.scalars(select(Item))
    items = items_result.all()

    res = []

    for item in items:
        seller = await db.get(Login, item.seller_id) if item.seller_id else None
        res.append(ItemRead
            (
                item_id=item.item_id,
                name=item.name,
                price=item.price,
                seller_id=item.seller_id,
                shop_name=seller.shop_name if seller else None
            )
        )

    return res

@router.get("/get-item/{item_id}", response_model=ItemRead)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    seller = await db.get(Login, item.seller_id) if item.seller_id else None

    return ItemRead(
        item_id=item.item_id,
        name=item.name,
        price=item.price,
        seller_id=item.seller_id,
        shop_name=seller.shop_name if seller else None
    )


@router.delete("/delete_item/{item_id}")
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()

    return {"ok": True}