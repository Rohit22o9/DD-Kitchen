from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

class BookingCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    business_name: Optional[str] = None
    email: str = Field(..., pattern=EMAIL_PATTERN)
    phone: str = Field(..., min_length=6, max_length=50)
    booking_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    duration_hours: float = Field(..., ge=1, le=24)
    intended_use: str = Field(..., min_length=2)
    team_size: int = Field(default=1, ge=1, le=20)
    equipment_requirements: Optional[str] = None
    additional_notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    reference_code: str
    full_name: str
    business_name: Optional[str] = None
    email: str
    phone: str
    booking_date: str
    start_time: str
    end_time: str
    duration_hours: float
    intended_use: str
    team_size: int
    equipment_requirements: Optional[str] = None
    additional_notes: Optional[str] = None
    hourly_rate: float
    base_price: float
    cleaning_fee: float
    total_price: float
    status: str
    payment_status: str
    admin_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BookingStatusUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    admin_notes: Optional[str] = None

class BlockedSlotCreate(BaseModel):
    block_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    reason: Optional[str] = "Maintenance / Sanitization"

class BlockedSlotResponse(BaseModel):
    id: int
    block_date: str
    start_time: str
    end_time: str
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class KitchenSettingsUpdate(BaseModel):
    hourly_rental_rate: Optional[float] = None
    min_rental_hours: Optional[int] = None
    operating_hours_start: Optional[str] = None
    operating_hours_end: Optional[str] = None
    cleaning_fee: Optional[float] = None
    security_deposit: Optional[float] = None
    kitchen_name: Optional[str] = None
    kitchen_address: Optional[str] = None
    kitchen_phone: Optional[str] = None
    kitchen_email: Optional[str] = None
    kitchen_whatsapp: Optional[str] = None

class EnquiryCreate(BaseModel):
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=6)
    email: str = Field(..., pattern=EMAIL_PATTERN)
    business_name: Optional[str] = None
    preferred_date: Optional[str] = None
    estimated_hours: Optional[str] = None
    business_type: Optional[str] = None
    registered_in_victoria_park: Optional[str] = "No"
    message: str = Field(..., min_length=5)

class EnquiryResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: str
    business_name: Optional[str]
    preferred_date: Optional[str]
    estimated_hours: Optional[str]
    business_type: Optional[str]
    registered_in_victoria_park: Optional[str] = "No"
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AdminLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class SlotInterval(BaseModel):
    start_time: str
    end_time: str
    status: str # 'available', 'booked', 'blocked'
    reference: Optional[str] = None
    reason: Optional[str] = None

class AvailabilityResponse(BaseModel):
    date: str
    operating_hours: dict
    hourly_rate: float
    min_hours: int
    slots: List[SlotInterval]
    existing_bookings_count: int
