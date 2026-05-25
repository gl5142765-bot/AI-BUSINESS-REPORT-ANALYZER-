# app/payment_claims.py

from sqlalchemy import Column, String, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base  # same Base you use for other models

class PaymentClaim(Base):
    __tablename__ = "payment_claims"

    id = Column(String, primary_key=True)  # we can fill this manually later
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String, nullable=False)  # e.g. "upi-qr"
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)
    note = Column(Text, nullable=True)