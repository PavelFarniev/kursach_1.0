from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class CourseSlide(Base, TimestampMixin):
    __tablename__ = "course_slides"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    theory_blocks: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    bullets: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    example: Mapped[str] = mapped_column(Text, nullable=False)
    practice_task: Mapped[str] = mapped_column(Text, nullable=False)

    course = relationship("Course", back_populates="slides")
