from datetime import datetime, date, timedelta
import random
import string
from sqlalchemy.orm import Session
from .models import Booking, BlockedSlot, KitchenSetting

DEFAULT_SETTINGS = {
    "hourly_rental_rate": "38.0",
    "min_rental_hours": "4",
    "operating_hours_start": "00:00",
    "operating_hours_end": "24:00",
    "cleaning_fee": "0.0",
    "security_deposit": "750.0",
    "kitchen_name": "Daily Drop Commercial Kitchen Hub 1",
    "kitchen_address": "Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101",
    "kitchen_phone": "0479 175 705",
    "kitchen_email": "hello@dailydrop.today",
    "kitchen_whatsapp": "+61479175705",
    "currency_symbol": "$",
}

def get_setting(db: Session, key: str) -> str:
    setting = db.query(KitchenSetting).filter(KitchenSetting.key == key).first()
    if setting:
        return setting.value
    return DEFAULT_SETTINGS.get(key, "")

def get_all_settings(db: Session) -> dict:
    all_db = {s.key: s.value for s in db.query(KitchenSetting).all()}
    res = DEFAULT_SETTINGS.copy()
    res.update(all_db)
    # Parse numbers
    return {
        "hourly_rental_rate": float(res["hourly_rental_rate"]),
        "min_rental_hours": int(res["min_rental_hours"]),
        "operating_hours_start": res["operating_hours_start"],
        "operating_hours_end": res["operating_hours_end"],
        "cleaning_fee": float(res["cleaning_fee"]),
        "security_deposit": float(res["security_deposit"]),
        "kitchen_name": res["kitchen_name"],
        "kitchen_address": res["kitchen_address"],
        "kitchen_phone": res["kitchen_phone"],
        "kitchen_email": res["kitchen_email"],
        "kitchen_whatsapp": res["kitchen_whatsapp"],
        "currency_symbol": res.get("currency_symbol", "$"),
    }

def generate_reference_code() -> str:
    random_digits = "".join(random.choices(string.digits, k=5))
    return f"DD-K-{random_digits}"

def parse_time_to_minutes(time_str: str) -> int:
    if time_str == "24:00":
        return 24 * 60
    h, m = map(int, time_str.split(":"))
    return h * 60 + m

def minutes_to_time_str(mins: int) -> str:
    h = mins // 60
    m = mins % 60
    return f"{h:02d}:{m:02d}"

def calculate_end_time(start_time: str, duration_hours: float) -> str:
    start_minutes = parse_time_to_minutes(start_time)
    duration_minutes = int(duration_hours * 60)
    end_minutes = start_minutes + duration_minutes
    return minutes_to_time_str(end_minutes)

def check_time_overlap(start_a: str, end_a: str, start_b: str, end_b: str) -> bool:
    a_start = parse_time_to_minutes(start_a)
    a_end = parse_time_to_minutes(end_a)
    b_start = parse_time_to_minutes(start_b)
    b_end = parse_time_to_minutes(end_b)
    
    # Overlap occurs if max(starts) < min(ends)
    return max(a_start, b_start) < min(a_end, b_end)

def validate_booking_slot(
    db: Session,
    booking_date: str,
    start_time: str,
    duration_hours: float,
    exclude_booking_id: int = None
) -> tuple[bool, str, str]:
    """
    Validates booking against:
    1. Past dates
    2. Kitchen operating hours
    3. Minimum rental duration
    4. Overlapping confirmed or approved bookings
    5. Blocked maintenance slots
    Returns: (is_valid, error_message, calculated_end_time)
    """
    settings = get_all_settings(db)
    
    # 1. Past date check
    try:
        book_d = datetime.strptime(booking_date, "%Y-%m-%d").date()
        today = date.today()
        if book_d < today:
            return False, "Cannot book a date in the past.", ""
    except ValueError:
        return False, "Invalid date format. Expected YYYY-MM-DD.", ""

    # 2. Minimum hours check
    min_hours = settings["min_rental_hours"]
    if duration_hours < min_hours:
        return False, f"Minimum rental duration is {min_hours} hours.", ""
    
    # 3. Calculate end time and check operating hours
    end_time = calculate_end_time(start_time, duration_hours)
    op_start = settings["operating_hours_start"]
    op_end = settings["operating_hours_end"]
    
    start_mins = parse_time_to_minutes(start_time)
    end_mins = parse_time_to_minutes(end_time)
    op_start_mins = parse_time_to_minutes(op_start)
    op_end_mins = parse_time_to_minutes(op_end)
    
    if start_mins < op_start_mins or end_mins > op_end_mins:
        return False, f"Kitchen operating hours are from {op_start} to {op_end}. Rental cannot exceed operating hours.", end_time

    # 4. Check overlapping bookings (approved or confirmed)
    query = db.query(Booking).filter(
        Booking.booking_date == booking_date,
        Booking.status.in_(["approved", "confirmed", "pending"]) # Pending also temporarily locks slot
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
        
    for existing in query.all():
        if check_time_overlap(start_time, end_time, existing.start_time, existing.end_time):
            return False, f"The selected time slot ({start_time} - {end_time}) conflicts with an existing reservation ({existing.start_time} - {existing.end_time}).", end_time

    # 5. Check blocked slots
    blocked_slots = db.query(BlockedSlot).filter(BlockedSlot.block_date == booking_date).all()
    for block in blocked_slots:
        if check_time_overlap(start_time, end_time, block.start_time, block.end_time):
            return False, f"The selected slot conflicts with a scheduled kitchen maintenance block ({block.start_time} - {block.end_time}: {block.reason}).", end_time

    return True, "", end_time
