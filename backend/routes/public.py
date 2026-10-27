from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, date
from ..database import get_db
from ..models import Booking, BlockedSlot, Enquiry, KitchenSetting
from ..schemas import (
    BookingCreate,
    BookingResponse,
    EnquiryCreate,
    EnquiryResponse,
    AvailabilityResponse,
    SlotInterval
)
from ..booking_service import (
    get_all_settings,
    generate_reference_code,
    validate_booking_slot,
    calculate_end_time,
    parse_time_to_minutes,
    minutes_to_time_str
)
from ..email_service import send_booking_confirmation_email

router = APIRouter(prefix="/api", tags=["Public"])

@router.get("/config")
def get_public_config(db: Session = Depends(get_db)):
    """Return public kitchen config including rates, operating hours, address, and policies."""
    settings = get_all_settings(db)
    return settings

@router.get("/availability", response_model=AvailabilityResponse)
def get_availability(date_str: str = Query(..., alias="date", pattern=r"^\d{4}-\d{2}-\d{2}$"), db: Session = Depends(get_db)):
    """
    Returns time slot availability for the specified date,
    including blocked maintenance periods and existing reservations.
    """
    settings = get_all_settings(db)
    
    # Existing bookings for this date (pending, approved, confirmed)
    bookings = db.query(Booking).filter(
        Booking.booking_date == date_str,
        Booking.status.in_(["pending", "approved", "confirmed"])
    ).all()
    
    # Blocked maintenance slots
    blocked = db.query(BlockedSlot).filter(BlockedSlot.block_date == date_str).all()
    
    slots: list[SlotInterval] = []
    
    for b in bookings:
        slots.append(SlotInterval(
            start_time=b.start_time,
            end_time=b.end_time,
            status="booked",
            reference=b.reference_code,
            reason=f"Reserved ({b.status.capitalize()})"
        ))
        
    for blk in blocked:
        slots.append(SlotInterval(
            start_time=blk.start_time,
            end_time=blk.end_time,
            status="blocked",
            reference=None,
            reason=blk.reason
        ))
        
    slots.sort(key=lambda s: parse_time_to_minutes(s.start_time))
    
    return AvailabilityResponse(
        date=date_str,
        operating_hours={
            "start": settings["operating_hours_start"],
            "end": settings["operating_hours_end"]
        },
        hourly_rate=settings["hourly_rental_rate"],
        min_hours=settings["min_rental_hours"],
        slots=slots,
        existing_bookings_count=len(bookings)
    )

@router.get("/month-availability")
def get_month_availability(
    year: int = Query(..., ge=2020, le=2035),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated availability summary, slot status, and equipment use
    for each day of the specified calendar month.
    """
    import calendar
    _, last_day = calendar.monthrange(year, month)
    start_date = f"{year:04d}-{month:02d}-01"
    end_date = f"{year:04d}-{month:02d}-{last_day:02d}"
    
    bookings = db.query(Booking).filter(
        Booking.booking_date >= start_date,
        Booking.booking_date <= end_date,
        Booking.status.in_(["pending", "approved", "confirmed"])
    ).all()
    
    blocked = db.query(BlockedSlot).filter(
        BlockedSlot.block_date >= start_date,
        BlockedSlot.block_date <= end_date
    ).all()
    
    result = {}
    for day in range(1, last_day + 1):
        d_str = f"{year:04d}-{month:02d}-{day:02d}"
        day_bookings = [b for b in bookings if b.booking_date == d_str]
        day_blocked = [b for b in blocked if b.block_date == d_str]
        
        slots = []
        equipment_set = set()
        total_booked_hours = 0.0
        
        for b in day_bookings:
            slots.append({
                "start_time": b.start_time,
                "end_time": b.end_time,
                "status": "booked",
                "reference": b.reference_code,
                "reason": f"Reserved ({b.status.capitalize()})"
            })
            total_booked_hours += float(b.duration_hours or 0)
            if b.equipment_requirements:
                for eq in b.equipment_requirements.split(","):
                    clean_eq = eq.strip()
                    if clean_eq:
                        equipment_set.add(clean_eq)
                        
        for blk in day_blocked:
            slots.append({
                "start_time": blk.start_time,
                "end_time": blk.end_time,
                "status": "blocked",
                "reference": None,
                "reason": blk.reason or "Maintenance Block"
            })
            
        is_all_day_blocked = any(blk.start_time == "00:00" and blk.end_time in ["24:00", "23:59"] for blk in day_blocked)
        status_val = "available"
        if is_all_day_blocked or total_booked_hours >= 22:
            status_val = "blocked" if is_all_day_blocked else "fully_booked"
        elif total_booked_hours > 0 or len(day_blocked) > 0:
            status_val = "partially_booked"
            
        result[d_str] = {
            "date": d_str,
            "total_booked_hours": total_booked_hours,
            "available_hours": max(0.0, 24.0 - total_booked_hours),
            "bookings_count": len(day_bookings),
            "status": status_val,
            "slots": slots,
            "equipment_in_use": list(equipment_set)
        }
        
    return result

@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_request(booking_in: BookingCreate, db: Session = Depends(get_db)):
    """
    Submit a kitchen rental booking request.
    Strictly validates slot availability, minimum duration, and operating hours.
    Calculates transparent pricing using current settings.
    """
    is_valid, err_msg, end_time = validate_booking_slot(
        db=db,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        duration_hours=booking_in.duration_hours
    )
    
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        
    settings = get_all_settings(db)
    hourly_rate = settings["hourly_rental_rate"]
    cleaning_fee = settings["cleaning_fee"]
    base_price = round(hourly_rate * booking_in.duration_hours, 2)
    total_price = round(base_price + cleaning_fee, 2)
    
    ref_code = generate_reference_code()
    # Check uniqueness
    while db.query(Booking).filter(Booking.reference_code == ref_code).first():
        ref_code = generate_reference_code()
        
    booking = Booking(
        reference_code=ref_code,
        full_name=booking_in.full_name,
        business_name=booking_in.business_name,
        email=booking_in.email,
        phone=booking_in.phone,
        booking_date=booking_in.booking_date,
        start_time=booking_in.start_time,
        end_time=end_time,
        duration_hours=booking_in.duration_hours,
        intended_use=booking_in.intended_use,
        team_size=booking_in.team_size,
        equipment_requirements=booking_in.equipment_requirements,
        additional_notes=booking_in.additional_notes,
        hourly_rate=hourly_rate,
        base_price=base_price,
        cleaning_fee=cleaning_fee,
        total_price=total_price,
        status="pending",
        payment_status="unpaid"
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Dispatch confirmation email with payment instructions
    try:
        send_booking_confirmation_email({
            "reference_code": booking.reference_code,
            "email": booking.email,
            "full_name": booking.full_name,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "duration_hours": booking.duration_hours,
            "total_price": booking.total_price
        })
    except Exception as email_err:
        print(f"Warning: Could not send confirmation email: {email_err}")

    return booking

@router.get("/bookings/{reference_code}", response_model=BookingResponse)
def get_booking_by_reference(reference_code: str, db: Session = Depends(get_db)):
    """Retrieve booking details by its reference code (e.g. for confirmation screen)."""
    booking = db.query(Booking).filter(Booking.reference_code == reference_code).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking reference not found.")
    return booking

@router.post("/enquiries", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_enquiry(enquiry_in: EnquiryCreate, db: Session = Depends(get_db)):
    """Submit a contact or custom commercial kitchen rental enquiry."""
    enquiry = Enquiry(
        name=enquiry_in.name,
        phone=enquiry_in.phone,
        email=enquiry_in.email,
        business_name=enquiry_in.business_name,
        preferred_date=enquiry_in.preferred_date,
        estimated_hours=enquiry_in.estimated_hours,
        business_type=enquiry_in.business_type,
        registered_in_victoria_park=enquiry_in.registered_in_victoria_park or "No",
        message=enquiry_in.message,
        status="new"
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry
