from database import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Cart(Base):
    __tablename__ = "Bag"

    cart_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("Good.item_id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)
