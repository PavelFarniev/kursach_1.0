from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class UserActivity(Base, TimestampMixin):
    __tablename__ = "user_activities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    value: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    user = relationship("User", back_populates="activities")
    course = relationship("Course", back_populates="activities")
