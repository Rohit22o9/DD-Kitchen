from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from typing import Optional, List
from ..database import get_db
from ..models import Booking, BlockedSlot, KitchenSetting, Enquiry, AdminUser
from ..schemas import (
    AdminLogin,
    TokenResponse,
    BookingResponse,
    BookingStatusUpdate,
    BlockedSlotCreate,
    BlockedSlotResponse,
    KitchenSettingsUpdate,
    EnquiryResponse
)
from ..auth import verify_password, create_access_token, get_current_admin
from ..booking_service import get_all_settings, check_time_overlap, validate_booking_slot

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/login", response_model=TokenResponse)
def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == login_data.username).first()
    if not admin or not verify_password(login_data.password, admin.password_hash, admin.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    access_token = create_access_token(data={"sub": admin.username})
    return TokenResponse(access_token=access_token, username=admin.username)

@router.get("/dashboard-stats")
def get_dashboard_stats(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_bookings = db.query(Booking).count()
    pending = db.query(Booking).filter(Booking.status == "pending").count()
    approved = db.query(Booking).filter(Booking.status == "approved").count()
    confirmed = db.query(Booking).filter(Booking.status == "confirmed").count()
    completed = db.query(Booking).filter(Booking.status == "completed").count()
    rejected_or_cancelled = db.query(Booking).filter(Booking.status.in_(["rejected", "cancelled"])).count()
    
    # Revenue stats from confirmed & completed bookings
    confirmed_bookings = db.query(Booking).filter(Booking.status.in_(["confirmed", "completed"])).all()
    total_revenue = sum(b.total_price for b in confirmed_bookings)
    total_hours = sum(b.duration_hours for b in confirmed_bookings)
    
    # Potential revenue from pending + approved
    pipeline_bookings = db.query(Booking).filter(Booking.status.in_(["pending", "approved"])).all()
    pipeline_revenue = sum(b.total_price for b in pipeline_bookings)
    
    total_enquiries = db.query(Enquiry).count()
    new_enquiries = db.query(Enquiry).filter(Enquiry.status == "new").count()
    
    return {
        "total_bookings": total_bookings,
        "pending_requests": pending,
        "approved_count": approved,
        "confirmed_count": confirmed,
        "completed_count": completed,
        "cancelled_count": rejected_or_cancelled,
        "total_confirmed_revenue": round(total_revenue, 2),
        "pipeline_revenue": round(pipeline_revenue, 2),
        "total_hours_booked": total_hours,
        "total_enquiries": total_enquiries,
        "new_enquiries": new_enquiries
    }

@router.get("/bookings", response_model=List[BookingResponse])
def get_admin_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if status_filter and status_filter != "all":
        query = query.filter(Booking.status == status_filter)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Booking.full_name.ilike(s)) |
            (Booking.business_name.ilike(s)) |
            (Booking.email.ilike(s)) |
            (Booking.reference_code.ilike(s))
        )
    return query.order_by(Booking.booking_date.desc(), Booking.start_time.asc()).all()

@router.patch("/bookings/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    update_data: BookingStatusUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if update_data.status:
        target_status = update_data.status.lower()
        if target_status not in ["pending", "approved", "confirmed", "rejected", "cancelled", "completed"]:
            raise HTTPException(status_code=400, detail="Invalid status value")
            
        # If moving to confirmed or approved, verify no other confirmed reservation conflicts
        if target_status in ["approved", "confirmed"]:
            is_valid, err, _ = validate_booking_slot(
                db=db,
                booking_date=booking.booking_date,
                start_time=booking.start_time,
                duration_hours=booking.duration_hours,
                exclude_booking_id=booking.id
            )
            # Note: We allow approving if only other pending exists, but if conflicting with confirmed, reject
            conflicts = db.query(Booking).filter(
                Booking.booking_date == booking.booking_date,
                Booking.id != booking.id,
                Booking.status == "confirmed"
            ).all()
            for c in conflicts:
                if check_time_overlap(booking.start_time, booking.end_time, c.start_time, c.end_time):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot confirm: conflicts with already confirmed booking {c.reference_code} ({c.start_time} - {c.end_time})"
                    )
        booking.status = target_status
        
    if update_data.payment_status:
        if update_data.payment_status not in ["unpaid", "deposit_paid", "paid", "refunded"]:
            raise HTTPException(status_code=400, detail="Invalid payment status")
        booking.payment_status = update_data.payment_status
        
    if update_data.admin_notes is not None:
        booking.admin_notes = update_data.admin_notes
        
    booking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    return booking

@router.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(booking)
    db.commit()
    return {"message": f"Booking {booking.reference_code} deleted successfully"}

@router.get("/blocked-slots", response_model=List[BlockedSlotResponse])
def get_blocked_slots(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(BlockedSlot).order_by(BlockedSlot.block_date.desc(), BlockedSlot.start_time.asc()).all()

@router.post("/blocked-slots", response_model=BlockedSlotResponse, status_code=status.HTTP_201_CREATED)
def create_blocked_slot(
    block_in: BlockedSlotCreate,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    slot = BlockedSlot(
        block_date=block_in.block_date,
        start_time=block_in.start_time,
        end_time=block_in.end_time,
        reason=block_in.reason or "Maintenance"
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot

@router.delete("/blocked-slots/{slot_id}")
def delete_blocked_slot(
    slot_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(BlockedSlot).filter(BlockedSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Blocked slot not found")
    db.delete(slot)
    db.commit()
    return {"message": "Blocked slot deleted"}

@router.get("/config")
def get_admin_config(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    return get_all_settings(db)

@router.put("/config")
def update_admin_config(
    settings_in: KitchenSettingsUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    data = settings_in.dict(exclude_unset=True)
    for k, v in data.items():
        if v is not None:
            setting = db.query(KitchenSetting).filter(KitchenSetting.key == k).first()
            if setting:
                setting.value = str(v)
            else:
                db.add(KitchenSetting(key=k, value=str(v), description=f"Config for {k}"))
    db.commit()
    return get_all_settings(db)

@router.get("/enquiries", response_model=List[EnquiryResponse])
def get_enquiries(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Enquiry).order_by(Enquiry.created_at.desc()).all()

@router.patch("/enquiries/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: int,
    status_val: str = Query(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    enquiry.status = status_val
    db.commit()
    return {"id": enquiry.id, "status": enquiry.status}
