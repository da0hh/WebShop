from database import Base
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Item(Base):
    __tablename__ = "Good"

    item_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    price: Mapped[int] = mapped_column(nullable=False)
    seller_id: Mapped[int] = mapped_column(ForeignKey("Login.user_id"), nullable=True)

    seller = relationship("Login", back_populates="items")