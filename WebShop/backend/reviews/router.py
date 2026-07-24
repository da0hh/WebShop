from typing import List

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db

from reviews.models import Review
from reviews.schemas import ReadReview, CreateReview, DeleteReview

router = APIRouter()

@router.post("/create", response_model=ReadReview)
async def create_review(payload: CreateReview, db: AsyncSession = Depends(get_db)):
    new_review = Review(
        user_id=payload.user_id,
        item_id=payload.item_id,
        author=payload.author,
        body=payload.body,
        rating=payload.rating
    )

    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)

    return ReadReview(
        review_id=new_review.review_id,
        user_id=new_review.user_id,
        item_id=new_review.item_id,
        author=payload.author,
        body=new_review.body,
        rating=new_review.rating,
        created_at=new_review.created_at
    )

@router.get("/list-reviews-item/{item_id}", response_model=List[ReadReview])
async def reviews_list(item_id: int, db: AsyncSession = Depends(get_db)):
    all_reviews = await db.execute(select(Review).where(Review.item_id == item_id).order_by(Review.created_at.desc()))

    return [
        ReadReview(
            review_id=review.review_id,
            user_id=review.user_id,
            item_id=review.item_id,
            author=review.author,
            body=review.body,
            rating=review.rating,
            created_at=review.created_at
        )
        for review in all_reviews.scalars().all()
    ]

@router.delete("/remove-review")
async def delete_review(payload: DeleteReview, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(
            Review.review_id == payload.review_id,
            Review.user_id == payload.user_id,
            Review.item_id == payload.item_id
        )
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    await db.delete(review)
    await db.commit()

    return {"ok": True}