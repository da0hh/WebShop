from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from contextlib import asynccontextmanager

from cart.router import router as cart_router
from items.router import router as items_router
from login.router import router as login_router
from orders.router import router as orders_router
from reviews.router import router as reviews_router
from favourites.router import router as favourites_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cart_router, prefix="/cart", tags=["carts"])
app.include_router(items_router, prefix="/item", tags=["items"])
app.include_router(login_router, prefix="/login", tags=["login"])
app.include_router(orders_router, prefix="/order", tags=["orders"])
app.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
app.include_router(favourites_router, prefix="/favourites", tags=["favourites"])

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}