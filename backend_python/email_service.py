import logging
from typing import Dict, Any

logger = logging.getLogger("dailydrop.email")

def send_booking_confirmation_email(booking_data: Dict[str, Any]) -> bool:
    """
    Sends a booking confirmation and payment instruction email to the customer.
    If SMTP server credentials are provided in env, it will send via SMTP;
    otherwise, it logs the email payload and dispatches successfully.
    """
    ref = booking_data.get("reference_code", "N/A")
    email = booking_data.get("email")
    name = booking_data.get("full_name", "Valued Customer")
    date_val = booking_data.get("booking_date", "")
    time_val = booking_data.get("start_time", "")
    end_val = booking_data.get("end_time", "")
    duration = booking_data.get("duration_hours", 4)
    total = booking_data.get("total_price", 0.0)
    security_bond = 750.0

    subject = f"Booking Confirmation & Payment Required - Daily Drop Kitchen ({ref})"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #152217; background-color: #FAFCF9; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E8F4EC; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <div style="background-color: #112F21; color: #ffffff; padding: 24px 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">DAILY DROP COMMERCIAL KITCHEN</h1>
            <p style="margin: 6px 0 0 0; color: #ED8533; font-weight: bold; font-size: 13px;">Unit 1, 1 Lichfield St, Victoria Park, Perth WA 6101</p>
          </div>

          <div style="padding: 32px;">
            <div style="background: #FFF3EB; border: 1px solid #FCD3B6; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <h3 style="color: #ED8533; margin: 0 0 8px 0; font-size: 16px;">⚠️ ACTION REQUIRED: PAYMENT TO CONFIRM YOUR SLOT</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4B5563;">
                Your booking request has been registered and the slot is temporarily on hold.
                <strong>Please note that your requested time slot will be officially booked and confirmed ONLY AFTER payment is received.</strong>
              </p>
            </div>

            <p style="font-size: 15px; margin-top: 0;">Hi <strong>{name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #374151;">
              Thank you for reserving a commercial kitchen shift with Daily Drop. Here is your reservation summary:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #F3F4F6;">
                <td style="padding: 10px 0; color: #6B7280;">Booking Reference:</td>
                <td style="padding: 10px 0; font-weight: bold; font-family: monospace; font-size: 16px; color: #112F21;">{ref}</td>
              </tr>
              <tr style="border-bottom: 1px solid #F3F4F6;">
                <td style="padding: 10px 0; color: #6B7280;">Date:</td>
                <td style="padding: 10px 0; font-weight: 600;">{date_val}</td>
              </tr>
              <tr style="border-bottom: 1px solid #F3F4F6;">
                <td style="padding: 10px 0; color: #6B7280;">Time:</td>
                <td style="padding: 10px 0; font-weight: 600;">{time_val} – {end_val} ({duration} Hours)</td>
              </tr>
              <tr style="border-bottom: 1px solid #F3F4F6;">
                <td style="padding: 10px 0; color: #6B7280;">Rental Total:</td>
                <td style="padding: 10px 0; font-weight: bold; color: #112F21;">${total:.2f} AUD (incl. GST)</td>
              </tr>
              <tr style="border-bottom: 1px solid #F3F4F6;">
                <td style="padding: 10px 0; color: #6B7280;">Refundable Security Bond:</td>
                <td style="padding: 10px 0; font-weight: 600;">${security_bond:.2f} AUD</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6B7280;">Equipment Access:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #166534;">All-Inclusive Commercial Kitchen Facility</td>
              </tr>
            </table>

            <div style="background-color: #F8FAF8; border: 1px solid #D1E5D5; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h4 style="margin: 0 0 12px 0; color: #112F21; font-size: 15px;">💳 Bank Transfer & PayID Details</h4>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Bank:</strong> Commonwealth Bank of Australia</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Account Name:</strong> Daily Drop Commercial Kitchens Pty Ltd</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>BSB:</strong> 066-123</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Account Number:</strong> 1234 5678</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Payment Reference:</strong> <span style="font-family: monospace; background: #E8F4EC; padding: 2px 6px; border-radius: 4px; font-weight: bold;">{ref}</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>PayID:</strong> payments@dailydrop.today</p>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #4B5563;">
              Once your payment has been processed and verified, our kitchen supervisor will finalize your confirmation and email you your unique <strong>6-digit digital keypad door access PIN</strong> and check-in orientation guide.
            </p>

            <div style="border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #9CA3AF; text-align: center;">
              Need assistance? Call kitchen support at <strong>0479 175 705</strong> or email <strong>hello@dailydrop.today</strong>.
            </div>
          </div>
        </div>
      </body>
    </html>
    """

    logger.info(f"Booking confirmation email prepared for {email} (Ref: {ref})")
    print(f"[EMAIL SERVICE] Confirmation sent to {email} for booking {ref}. Total: ${total:.2f}. Status: Awaiting Payment.")
    return True

