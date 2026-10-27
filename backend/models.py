import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from .database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    reference_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    business_name = Column(String(150), nullable=True)
    abn = Column(String(50), nullable=True)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    
    booking_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(5), nullable=False)                 # HH:MM (e.g. 09:00)
    end_time = Column(String(5), nullable=False)                   # HH:MM (e.g. 13:00)
    duration_hours = Column(Float, nullable=False)
    
    intended_use = Column(String(150), nullable=False)
    team_size = Column(Integer, default=1)
    equipment_requirements = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    
    hourly_rate = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    cleaning_fee = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False)
    
    # Status: pending, approved, confirmed, rejected, cancelled, completed
    status = Column(String(30), default="pending", index=True)
    # Payment status: unpaid, deposit_paid, paid, refunded
    payment_status = Column(String(30), default="unpaid")
    admin_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class BlockedSlot(Base):
    __tablename__ = "blocked_slots"

    id = Column(Integer, primary_key=True, index=True)
    block_date = Column(String(10), nullable=False, index=True) # YYYY-MM-DD
    start_time = Column(String(5), nullable=False)               # HH:MM
    end_time = Column(String(5), nullable=False)                 # HH:MM
    reason = Column(String(255), default="Maintenance / Sanitization")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class KitchenSetting(Base):
    __tablename__ = "kitchen_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(String(500), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(150), nullable=False)
    business_name = Column(String(150), nullable=True)
    preferred_date = Column(String(50), nullable=True)
    estimated_hours = Column(String(50), nullable=True)
    business_type = Column(String(100), nullable=True)
    registered_in_victoria_park = Column(String(10), default="No")
    message = Column(Text, nullable=False)
    status = Column(String(30), default="new")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    salt = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    salt = Column(String(100), nullable=False)
    full_name = Column(String(150), nullable=False)
    business_name = Column(String(150), nullable=True)
    abn = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    food_safety_cert_name = Column(String(255), nullable=True)
    food_safety_cert_data = Column(Text, nullable=True)
    liability_insurance_name = Column(String(255), nullable=True)
    liability_insurance_data = Column(Text, nullable=True)
    terms_accepted = Column(String(10), default="Yes")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class StorageBooking(Base):
    __tablename__ = "storage_bookings"

    id = Column(Integer, primary_key=True, index=True)
    reference_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    full_name = Column(String(150), nullable=False)
    business_name = Column(String(150), nullable=True)
    abn = Column(String(50), nullable=True)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    
    storage_type = Column(String(50), nullable=False)     # dry_storage, cool_room, freezer
    bay_number = Column(Integer, default=1)               # 1 or 2 (Max 2 bays capacity)
    start_date = Column(String(10), nullable=False)       # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)         # YYYY-MM-DD
    duration_days = Column(Integer, nullable=False)
    duration_type = Column(String(30), default="monthly") # daily, weekly, monthly, custom
    
    daily_rate = Column(Float, nullable=False, default=7.5)
    total_price = Column(Float, nullable=False)
    security_deposit = Column(Float, default=200.0)
    status = Column(String(30), default="pending", index=True)
    payment_status = Column(String(30), default="unpaid")
    special_requirements = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

