from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import JSON
from database import Base

from datetime import datetime

class Order(Base):
    __tablename__ = "Order"

    order_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(nullable=False)
    item_ids: Mapped[str] = mapped_column(JSON, nullable=False)
    total: Mapped[float] = mapped_column(nullable=False, default=0.0)
    ordered_at: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)
    status: Mapped[str] = mapped_column(default="Pending")