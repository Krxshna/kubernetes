from datetime import datetime

from sqlalchemy import Column, Integer, Text, DateTime

from database import Base


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    body = Column(Text, nullable=True, default="")
    updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    created = Column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"<Note id={self.id} body={self.body[:50]}>"
