from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class AIChatSession(Base, TimestampMixin):
    __tablename__ = "ai_chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(140), default="Course Assistant", nullable=False)

    user = relationship("User", back_populates="ai_chat_sessions")
    course = relationship("Course", back_populates="ai_chat_sessions")
    messages = relationship("AIChatMessage", back_populates="chat_session", cascade="all, delete-orphan")
