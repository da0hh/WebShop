from database import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import ForeignKey


class Favourite(Base):
    __tablename__ = "Favourite"

    favourite_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("Login.user_id"), nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("Good.item_id"), nullable=False)