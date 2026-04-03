from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    lessons_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_hours: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    notes = relationship("CourseNote", back_populates="course", cascade="all, delete-orphan")
    ai_chat_sessions = relationship("AIChatSession", back_populates="course", cascade="all, delete-orphan")
