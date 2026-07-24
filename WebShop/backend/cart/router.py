from fastapi import Depends, APIRouter, HTTPException

from cart.models import Cart
from cart.schemas import CartRead, CartItemAdd, CartItemRemove, CartResponse
from items.models import Item

from database import get_db
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.delete("/clear-cart/{user_id}", response_model=CartResponse)
async def clear_cart(user_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Cart).where(Cart.user_id == user_id))
    await db.commit()

    return CartResponse(
        cart_id=0,
        user_id=user_id,
        items=[],
        total=0
    )

@router.post("/user-cart/{user_id}", response_model=CartResponse)
async def get_cart(user_id: int, db: AsyncSession = Depends(get_db)):
    cart_items = await db.scalars(select(Cart).where(Cart.user_id == user_id))
    cart_items = cart_items.all()

    res = []
    total = 0

    for cart_item in cart_items:
        item = await db.get(Item, cart_item.item_id)
        if item:
            cart_read = CartRead(
                cart_id=cart_item.cart_id,
                user_id=cart_item.user_id,
                item_id=cart_item.item_id,
                quantity=cart_item.quantity,
                item_name=item.name,
                item_price=item.price
            )
            res.append(cart_read)
            total += item.price * cart_item.quantity

    return CartResponse(
        cart_id=cart_items[0].cart_id if cart_items else 0,
        user_id=user_id,
        items=res,
        total=total
    )

@router.delete("/remove-one", response_model=CartResponse)
async def remove_one_from_cart(payload: CartItemRemove, db: AsyncSession = Depends(get_db)):
    cart_item = await db.scalar(
        select(Cart).where(
            Cart.user_id == payload.user_id,
            Cart.item_id == payload.item_id
        )
    )

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not in cart")

    if cart_item.quantity > 1:
        cart_item.quantity -= 1
    else:
        await db.delete(cart_item)

    await db.commit()

    return await get_cart(payload.user_id, db)


@router.delete("/remove-all", response_model=CartResponse)
async def remove_all_from_cart(payload: CartItemRemove, db: AsyncSession = Depends(get_db)):
    cart_item = await db.scalar(
        select(Cart).where(
            Cart.user_id == payload.user_id,
            Cart.item_id == payload.item_id
        )
    )

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not in cart")

    await db.delete(cart_item)
    await db.commit()

    return await get_cart(payload.user_id, db)

@router.post("/add", response_model=CartResponse)
async def add_to_cart(payload: CartItemAdd, db: AsyncSession = Depends(get_db)):
    item = await db.get(Item, payload.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = await db.scalar(
        select(Cart).where(
            Cart.user_id == payload.user_id,
            Cart.item_id == payload.item_id
        )
    )

    if existing:
        existing.quantity += payload.quantity
    else:
        new_cart_item = Cart(
            user_id=payload.user_id,
            item_id=payload.item_id,
            quantity=payload.quantity
        )
        db.add(new_cart_item)

    await db.commit()

    return await get_cart(payload.user_id, db)

@router.post("/add-one", response_model=CartResponse)
async def add_one_to_cart(payload: CartItemAdd, db: AsyncSession = Depends(get_db)):
    cart_item = await db.scalar(select(Cart).
                                where(
        Cart.user_id == payload.user_id,
        Cart.item_id == payload.item_id
    ))

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not in cart")

    cart_item.quantity += 1

    await db.commit()

    return await get_cart(payload.user_id, db)