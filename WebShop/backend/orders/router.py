from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import json

from database import get_db
from orders.models import Order
from orders.schemas import ReadOrder, CreateOrder, CancelOrder
from items.models import Item

router = APIRouter()


@router.get("/all-orders/{user_id}", response_model=List[ReadOrder])
async def orders_list(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.user_id == user_id).order_by(Order.ordered_at.desc())
    )
    orders = result.scalars().all()

    return [
        ReadOrder(
            order_id=order.order_id,
            user_id=order.user_id,
            item_ids=json.loads(order.item_ids) if isinstance(order.item_ids, str) else order.item_ids,
            total=order.total,
            status=order.status,
            ordered_at=order.ordered_at
        )
        for order in orders
    ]


@router.get("/all-orders", response_model=List[ReadOrder])
async def all_orders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).order_by(Order.ordered_at.desc())
    )
    orders = result.scalars().all()

    return [
        ReadOrder(
            order_id=order.order_id,
            user_id=order.user_id,
            item_ids=json.loads(order.item_ids) if isinstance(order.item_ids, str) else order.item_ids,
            total=order.total,
            status=order.status,
            ordered_at=order.ordered_at
        )
        for order in orders
    ]

@router.post("/make-order", response_model=ReadOrder)
async def make_order(payload: CreateOrder, db: AsyncSession = Depends(get_db)):
    if not payload.order_items:
        raise HTTPException(status_code=400, detail="No items to order")

    total = 0
    for item_id in payload.order_items:
        item = await db.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        total += item.price

    new_order = Order(
        user_id=payload.user_id,
        item_ids=json.dumps(payload.order_items),
        total=total,
        status="Pending"
    )

    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    # ✅ Возвращаем ReadOrder, а не кортеж
    return ReadOrder(
        order_id=new_order.order_id,
        user_id=new_order.user_id,
        item_ids=payload.order_items,
        total=total,
        status=new_order.status,
        ordered_at=new_order.ordered_at
    )


@router.delete("/cancel-order")
async def cancel_order(payload: CancelOrder, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(
            Order.user_id == payload.user_id,
            Order.order_id == payload.order_id
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Order already cancelled")

    order.status = "Cancelled"
    await db.commit()

    return {"ok": True, "message": f"Order #{payload.order_id} cancelled successfully"}