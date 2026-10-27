/**
 * DAILY DROP COMMERCIAL KITCHEN - GOOGLE APPS SCRIPT WEBHOOK
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Rename the spreadsheet to: "Daily Drop Kitchen - Live Bookings & Enquiries"
 * 3. In the top menu, go to: Extensions > Apps Script
 * 4. Delete any code in the editor, and paste this entire code
 * 5. Click "Deploy" (top right) > "New deployment"
 * 6. Select type: "Web app" (click gear icon next to Select type)
 * 7. Set:
 *    - Description: "Daily Drop Live API"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (VERY IMPORTANT: Choose "Anyone" so the website can post data)
 * 8. Click "Deploy", authorize permissions when prompted, and copy the "Web app URL"
 * 9. Provide that URL back to me or add it to your frontend .env file!
 */

function setupSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Bookings Sheet
  var bookingsSheet = ss.getSheetByName("Bookings");
  if (!bookingsSheet) {
    bookingsSheet = ss.insertSheet("Bookings");
  }
  if (bookingsSheet.getLastRow() === 0) {
    var bookingHeaders = [
      "Timestamp",
      "Booking Reference",
      "Customer Name",
      "Business Name",
      "Email Address",
      "Phone Number",
      "Booking Date",
      "Start Time",
      "Duration (Hours)",
      "Rental Subtotal ($AUD)",
      "GST 10% ($AUD)",
      "Total Incl. GST ($AUD)",
      "Security Bond ($AUD)",
      "Intended Use",
      "Team Size",
      "Equipment Required",
      "Status",
      "Additional Notes"
    ];
    bookingsSheet.appendRow(bookingHeaders);
    bookingsSheet.getRange(1, 1, 1, bookingHeaders.length).setFontWeight("bold").setBackground("#E8F4EC").setFontColor("#152217");
    bookingsSheet.setFrozenRows(1);
  }

  // 2. Setup Enquiries Sheet
  var enquiriesSheet = ss.getSheetByName("Enquiries");
  if (!enquiriesSheet) {
    enquiriesSheet = ss.insertSheet("Enquiries");
  }
  if (enquiriesSheet.getLastRow() === 0) {
    var enquiryHeaders = [
      "Timestamp",
      "Enquiry Reference",
      "Full Name",
      "Business Name",
      "Email Address",
      "Phone Number",
      "Preferred Contact",
      "Rental Type",
      "Registered in Victoria Park?",
      "Message / Details",
      "Status"
    ];
    enquiriesSheet.appendRow(enquiryHeaders);
    enquiriesSheet.getRange(1, 1, 1, enquiryHeaders.length).setFontWeight("bold").setBackground("#FFF3EB").setFontColor("#ED8533");
    enquiriesSheet.setFrozenRows(1);
  }
}

// Handle Incoming Webhook Submissions (POST)
function doPost(e) {
  setupSheetHeaders();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    var action = data.action || (data.booking_date ? "create_booking" : "submit_enquiry");
    var timestamp = Utilities.formatDate(new Date(), "Australia/Perth", "yyyy-MM-dd HH:mm:ss");

    if (action === "create_booking") {
      var bookingsSheet = ss.getSheetByName("Bookings");
      var refCode = data.reference_code || ("DD-BK-" + Math.floor(10000 + Math.random() * 90000));
      
      var duration = Number(data.duration_hours) || 4;
      var subtotal = Number(data.base_cost) || (duration === 2 ? 100 : duration === 4 ? 152 : duration === 8 ? 256 : duration === 12 ? 360 : duration * 38);
      var gst = Number(data.gst_amount) || (subtotal * 0.10);
      var total = Number(data.total_cost) || (subtotal + gst);
      var bond = Number(data.security_deposit) || 750;

      bookingsSheet.appendRow([
        timestamp,
        refCode,
        data.full_name || "",
        data.business_name || "N/A",
        data.email || "",
        data.phone || "",
        data.booking_date || "",
        data.start_time || "",
        duration,
        subtotal.toFixed(2),
        gst.toFixed(2),
        total.toFixed(2),
        bond.toFixed(2),
        data.intended_use || "",
        data.team_size || 1,
        data.equipment_requirements || "Full Commercial Facility Access Included",
        data.status || "pending_approval",
        data.additional_notes || ""
      ]);

      // AUTOMATED CONFIRMATION EMAIL TO CUSTOMER WITH PAYMENT INSTRUCTIONS
      if (data.email) {
        try {
          var customerEmail = String(data.email).trim();
          var custName = data.full_name || "Valued Customer";
          var emailSubject = "Booking Received & Payment Required - Daily Drop Kitchen (" + refCode + ")";
          var emailHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E8F4EC; border-radius: 12px; overflow: hidden; background: #ffffff;">' +
            '<div style="background-color: #112F21; color: #ffffff; padding: 24px; text-align: center;">' +
              '<h2 style="margin: 0; font-size: 20px; letter-spacing: 1px;">DAILY DROP COMMERCIAL KITCHEN</h2>' +
              '<p style="margin: 6px 0 0; color: #ED8533; font-size: 13px; font-weight: bold;">Unit 1, 1 Lichfield St, Victoria Park, Perth WA 6101</p>' +
            '</div>' +
            '<div style="padding: 24px;">' +
              '<div style="background: #FFF3EB; border: 1px solid #FCD3B6; border-radius: 10px; padding: 16px; margin-bottom: 20px;">' +
                '<h3 style="color: #ED8533; margin: 0 0 6px 0; font-size: 15px;">⚠️ ACTION REQUIRED: PAYMENT TO CONFIRM YOUR SLOT</h3>' +
                '<p style="margin: 0; font-size: 13px; color: #4B5563; line-height: 1.5;">' +
                  'Your booking request has been received and the slot is temporarily on hold. ' +
                  '<strong>Please note: You need to complete your payment before the slot is officially booked.</strong> ' +
                  'After payment is verified, your slot will be locked in and your electronic door entry PIN will be sent.' +
                '</p>' +
              '</div>' +
              '<p style="font-size: 14px; margin-top: 0;">Hi <strong>' + custName + '</strong>,</p>' +
              '<p style="font-size: 13px; color: #374151; line-height: 1.5;">' +
                'Thank you for booking with Daily Drop Commercial Kitchen. Here is your reservation summary:' +
              '</p>' +
              '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Reference Code:</td><td style="padding: 8px 0; font-weight: bold; font-family: monospace; color: #112F21;">' + refCode + '</td></tr>' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Booking Date:</td><td style="padding: 8px 0; font-weight: bold;">' + (data.booking_date || 'N/A') + '</td></tr>' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Time & Duration:</td><td style="padding: 8px 0; font-weight: bold;">' + (data.start_time || '08:00') + ' (' + duration + ' Hours)</td></tr>' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Rental Total:</td><td style="padding: 8px 0; font-weight: bold; color: #112F21;">$' + total.toFixed(2) + ' AUD (incl. GST)</td></tr>' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Security Bond:</td><td style="padding: 8px 0; font-weight: bold;">$' + bond.toFixed(2) + ' AUD (refundable)</td></tr>' +
                '<tr><td style="padding: 8px 0; color: #6B7280;">Kitchen Equipment:</td><td style="padding: 8px 0; font-weight: bold; color: #166534;">All-Inclusive Commercial Kitchen Facility</td></tr>' +
              '</table>' +
              '<div style="background: #F8FAF8; border: 1px solid #D1E5D5; border-radius: 10px; padding: 16px; margin: 20px 0;">' +
                '<h4 style="margin: 0 0 10px 0; color: #112F21; font-size: 14px;">💳 Bank Transfer & PayID Details</h4>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>Bank:</strong> Commonwealth Bank of Australia</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>Account Name:</strong> Daily Drop Commercial Kitchens Pty Ltd</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>BSB:</strong> 066-123</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>Account Number:</strong> 1234 5678</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>Reference:</strong> <span style="font-family: monospace; background: #E8F4EC; padding: 2px 6px; border-radius: 3px; font-weight: bold;">' + refCode + '</span></p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>PayID:</strong> payments@dailydrop.today</p>' +
              '</div>' +
              '<p style="font-size: 12px; color: #4B5563; line-height: 1.5;">' +
                'Need urgent assistance or have questions? Contact us at <strong>hello@dailydrop.today</strong> or phone <strong>0479 175 705</strong>.' +
              '</p>' +
            '</div>' +
          '</div>';

          MailApp.sendEmail({
            to: customerEmail,
            subject: emailSubject,
            htmlBody: emailHtml
          });
        } catch (emailErr) {
          Logger.log("Customer email notification error: " + emailErr.toString());
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        reference_code: refCode,
        message: "Booking request saved successfully and confirmation email sent"
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === "submit_enquiry") {
      var enquiriesSheet = ss.getSheetByName("Enquiries");
      var enqRef = data.reference_code || ("DD-ENQ-" + Math.floor(10000 + Math.random() * 90000));

      enquiriesSheet.appendRow([
        timestamp,
        enqRef,
        data.full_name || "",
        data.business_name || "N/A",
        data.email || "",
        data.phone || "",
        data.preferred_contact || "Email",
        data.rental_type || "General Enquiry",
        data.registered_in_victoria_park ? "Yes" : "No",
        data.message || "",
        "new"
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        reference_code: enqRef,
        message: "Enquiry saved successfully in Google Sheets"
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === "update_booking_status") {
      var bookingsSheet = ss.getSheetByName("Bookings");
      var rows = bookingsSheet.getDataRange().getValues();
      var targetRef = data.reference_code || "";
      var targetId = Number(data.booking_id) || 0;
      var found = false;

      for (var i = 1; i < rows.length; i++) {
        var rowRef = rows[i][1];
        if ((targetRef && rowRef === targetRef) || (targetId && i === targetId)) {
          // Column 17 (Q) is Status, Column 18 (R) is Notes
          if (data.status) {
            bookingsSheet.getRange(i + 1, 17).setValue(data.status);
          }
          if (data.admin_notes) {
            bookingsSheet.getRange(i + 1, 18).setValue(data.admin_notes);
          }
          found = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: found ? "success" : "not_found",
        message: found ? "Booking status updated in Google Sheet" : "Booking reference not found in sheet"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unrecognized action: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (Allows Admin Dashboard to retrieve live bookings/enquiries from Google Sheet)
function doGet(e) {
  setupSheetHeaders();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) || "get_all";

  try {
    if (action === "get_bookings" || action === "get_all") {
      var sheet = ss.getSheetByName("Bookings");
      var rows = sheet.getDataRange().getValues();
      var bookings = [];
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r[1]) continue;
        var rawDate = r[6];
        var formattedDate = rawDate;
        if (rawDate instanceof Date) {
          formattedDate = Utilities.formatDate(rawDate, "Australia/Perth", "yyyy-MM-dd");
        }
        var rawTime = r[7];
        var formattedTime = rawTime;
        if (rawTime instanceof Date) {
          formattedTime = Utilities.formatDate(rawTime, "Australia/Perth", "HH:mm");
        }

        bookings.push({
          id: i,
          created_at: r[0],
          reference_code: r[1],
          full_name: r[2],
          business_name: r[3],
          email: r[4],
          phone: r[5],
          booking_date: formattedDate,
          start_time: formattedTime,
          duration_hours: Number(r[8]),
          base_cost: Number(r[9]),
          cleaning_fee: 0,
          security_deposit: Number(r[12]),
          total_cost: Number(r[11]),
          intended_use: r[13],
          team_size: Number(r[14]),
          equipment_requirements: r[15],
          status: r[16],
          additional_notes: r[17]
        });
      }
      if (action === "get_bookings") {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: bookings }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === "get_enquiries") {
      var sheet = ss.getSheetByName("Enquiries");
      var rows = sheet.getDataRange().getValues();
      var enquiries = [];
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r[1]) continue;
        enquiries.push({
          id: i,
          created_at: r[0],
          reference_code: r[1],
          full_name: r[2],
          business_name: r[3],
          email: r[4],
          phone: r[5],
          preferred_contact: r[6],
          rental_type: r[7],
          registered_in_victoria_park: r[8] === "Yes",
          message: r[9],
          status: r[10]
        });
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: enquiries }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Daily Drop Google Sheet Webhook is active and listening!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
