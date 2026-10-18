from datetime import date, datetime, timedelta
from .database import engine, Base, SessionLocal
from .models import AdminUser, KitchenSetting, Booking, BlockedSlot, Enquiry
from .auth import hash_password
from .booking_service import DEFAULT_SETTINGS

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Admin user
        admin = db.query(AdminUser).filter(AdminUser.username == "admin").first()
        if not admin:
            pwd_hash, salt = hash_password("admin123")
            admin = AdminUser(
                username="admin",
                password_hash=pwd_hash,
                salt=salt
            )
            db.add(admin)
            print("Admin user created: admin / admin123")
            
        # 2. Kitchen settings
        for k, v in DEFAULT_SETTINGS.items():
            s = db.query(KitchenSetting).filter(KitchenSetting.key == k).first()
            if not s:
                db.add(KitchenSetting(key=k, value=str(v), description=f"Default setting for {k}"))
                
        # 3. Seed sample bookings if empty
        if db.query(Booking).count() == 0:
            today = date.today()
            sample_bookings = [
                {
                    "reference_code": "DD-K-10824",
                    "full_name": "Shaun Tan",
                    "business_name": "Sedap Place Malaysian Catering",
                    "email": "shaunsedap@mail.com",
                    "phone": "0413 327 133",
                    "booking_date": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
                    "start_time": "08:00",
                    "end_time": "12:00",
                    "duration_hours": 4.0,
                    "intended_use": "Event Catering Batch Prep",
                    "team_size": 4,
                    "equipment_requirements": "6-Burner Gas Range, Prep Table 1, Walk-in Chiller rack",
                    "additional_notes": "Preparing laksa pastes and sambal for weekend corporate event.",
                    "hourly_rate": 45.0,
                    "base_price": 180.0,
                    "cleaning_fee": 25.0,
                    "total_price": 205.0,
                    "status": "confirmed",
                    "payment_status": "paid",
                    "admin_notes": "Security deposit verified. Access code sent."
                },
                {
                    "reference_code": "DD-K-10952",
                    "full_name": "Ashish Gulati",
                    "business_name": "Gulati Gourmet Curries",
                    "email": "ashish.gulati@gmail.com",
                    "phone": "+61 472 701 922",
                    "booking_date": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
                    "start_time": "14:00",
                    "end_time": "18:00",
                    "duration_hours": 4.0,
                    "intended_use": "Cloud Kitchen Delivery Prep",
                    "team_size": 3,
                    "equipment_requirements": "Tandoori station / Heavy stockpot burners, Combi Oven",
                    "additional_notes": "Weekly batch prep for cloud kitchen delivery hub.",
                    "hourly_rate": 45.0,
                    "base_price": 180.0,
                    "cleaning_fee": 25.0,
                    "total_price": 205.0,
                    "status": "confirmed",
                    "payment_status": "paid",
                    "admin_notes": "Regular partner tenant."
                },
                {
                    "reference_code": "DD-K-20381",
                    "full_name": "Elena Rostova",
                    "business_name": "Artisan Crumb Bakery",
                    "email": "elena@artisanbakes.com.au",
                    "phone": "+61 411 982 344",
                    "booking_date": (today + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "start_time": "06:00",
                    "end_time": "11:00",
                    "duration_hours": 5.0,
                    "intended_use": "Sourdough & Pastry Production",
                    "team_size": 2,
                    "equipment_requirements": "Deck oven, 20L spiral mixer, mobile proofer racks",
                    "additional_notes": "Early morning bake-off for farmers market delivery.",
                    "hourly_rate": 45.0,
                    "base_price": 225.0,
                    "cleaning_fee": 25.0,
                    "total_price": 250.0,
                    "status": "approved",
                    "payment_status": "deposit_paid",
                    "admin_notes": "Awaiting final balance payment before issuing keycard."
                },
                {
                    "reference_code": "DD-K-30472",
                    "full_name": "Marcus Vance",
                    "business_name": "Vance Chili & Sauce Co.",
                    "email": "marcus@vanceartisans.com",
                    "phone": "+61 432 890 123",
                    "booking_date": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
                    "start_time": "10:00",
                    "end_time": "14:00",
                    "duration_hours": 4.0,
                    "intended_use": "Hot Sauce Bottling & Hot Fill",
                    "team_size": 3,
                    "equipment_requirements": "Steam kettle, immersion blender, stainless pack line",
                    "additional_notes": "First time booking. Needs brief equipment safety walkthrough.",
                    "hourly_rate": 45.0,
                    "base_price": 180.0,
                    "cleaning_fee": 25.0,
                    "total_price": 205.0,
                    "status": "pending",
                    "payment_status": "unpaid",
                    "admin_notes": "Check food safety certification uploaded."
                }
            ]
            for sb in sample_bookings:
                db.add(Booking(**sb))
            print("Sample bookings created.")
            
        # 4. Blocked slot for deep sanitization
        if db.query(BlockedSlot).count() == 0:
            today = date.today()
            db.add(BlockedSlot(
                block_date=(today + timedelta(days=4)).strftime("%Y-%m-%d"),
                start_time="06:00",
                end_time="10:00",
                reason="Weekly High-Pressure Sanitization & Hood Filter Degreasing"
            ))
            
        # 5. Sample enquiries
        if db.query(Enquiry).count() == 0:
            db.add(Enquiry(
                name="Chef Chloe Dupont",
                phone="+61 405 889 102",
                email="chloe@dupontpastry.com",
                business_name="Dupont French Patisserie",
                preferred_date="Next month",
                estimated_hours="20 hrs/week",
                business_type="Bakery & Pastry",
                message="Hi Daily Drop team, we need 3 recurring weekday slots (6 AM - 11 AM) for our macaron production. Can we discuss long-term tenant rates?",
                status="new"
            ))
            
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
