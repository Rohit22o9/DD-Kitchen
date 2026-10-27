// @ts-nocheck
/* global SpreadsheetApp, Utilities, MailApp, ContentService, Logger */
/* eslint-disable no-unused-vars, no-undef */
/**
 * DAILY DROP COMMERCIAL KITCHEN & STORAGE - GOOGLE APPS SCRIPT WEBHOOK
 * Timezone: Australia/Perth (AWST · UTC+8)
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. In the top menu, go to: Extensions > Apps Script
 * 3. Delete any code in the editor, and paste this entire code
 * 4. Click "Deploy" (top right) > "Manage deployments" (or "New deployment")
 * 5. Edit deployment or create new Web App:
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (VERY IMPORTANT)
 * 6. Click Deploy and copy the Web App URL into your .env or Admin Settings!
 */

var PERTH_TZ = "Australia/Perth";

function setupSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Bookings Sheet
  var bookingsSheet = ss.getSheetByName("Bookings");
  if (!bookingsSheet) {
    bookingsSheet = ss.insertSheet("Bookings");
  }
  if (bookingsSheet.getLastRow() === 0) {
    var bookingHeaders = [
      "Timestamp (Perth)",
      "Booking Reference",
      "Customer Name",
      "Business Name",
      "ABN",
      "Email Address",
      "Phone Number",
      "Booking Date",
      "Start Time (AWST)",
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

  // 2. Setup Storage Sheet (Max 2 Bays Capacity)
  var storageSheet = ss.getSheetByName("Storage");
  if (!storageSheet) {
    storageSheet = ss.insertSheet("Storage");
  }
  if (storageSheet.getLastRow() === 0) {
    var storageHeaders = [
      "Timestamp (Perth)",
      "Storage Reference",
      "Tenant Name",
      "Business Name",
      "ABN",
      "Email Address",
      "Phone Number",
      "Storage Type",
      "Bay Number (1 or 2)",
      "Start Date",
      "End Date",
      "Duration (Days)",
      "Total Rental ($AUD)",
      "Security Bond ($AUD)",
      "Status",
      "Special Notes"
    ];
    storageSheet.appendRow(storageHeaders);
    storageSheet.getRange(1, 1, 1, storageHeaders.length).setFontWeight("bold").setBackground("#E0F2FE").setFontColor("#0369A1");
    storageSheet.setFrozenRows(1);
  }

  // 3. Setup Enquiries Sheet
  var enquiriesSheet = ss.getSheetByName("Enquiries");
  if (!enquiriesSheet) {
    enquiriesSheet = ss.insertSheet("Enquiries");
  }
  if (enquiriesSheet.getLastRow() === 0) {
    var enquiryHeaders = [
      "Timestamp (Perth)",
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
    var timestamp = Utilities.formatDate(new Date(), PERTH_TZ, "yyyy-MM-dd HH:mm:ss");

    // ==========================================
    // ACTION: CREATE KITCHEN BOOKING
    // ==========================================
    if (action === "create_booking") {
      var bookingsSheet = ss.getSheetByName("Bookings");
      var refCode = data.reference_code || ("DD-BK-" + Math.floor(10000 + Math.random() * 90000));
      
      var duration = Number(data.duration_hours) || 4;
      var subtotal = Number(data.base_cost) || (duration === 2 ? 100 : duration === 4 ? 152 : duration === 8 ? 256 : duration === 12 ? 360 : duration * 38);
      var gst = Number(data.gst_amount) || (subtotal * 0.10);
      var total = Number(data.total_cost) || (subtotal + gst);
      var bond = Number(data.security_deposit) || 750;

      // Prefix phone & time with apostrophe to ensure Google Sheets treats them as clean text
      var cleanPhone = data.phone ? String(data.phone) : "";
      if (cleanPhone && cleanPhone.indexOf("'") !== 0) cleanPhone = "'" + cleanPhone;

      var cleanTime = data.start_time ? String(data.start_time) : "09:00";
      if (cleanTime && cleanTime.indexOf("'") !== 0) cleanTime = "'" + cleanTime;

      bookingsSheet.appendRow([
        timestamp,
        refCode,
        data.full_name || "",
        data.business_name || "N/A",
        data.abn || "N/A",
        data.email || "",
        cleanPhone,
        data.booking_date || "",
        cleanTime,
        duration,
        subtotal.toFixed(2),
        gst.toFixed(2),
        total.toFixed(2),
        bond.toFixed(2),
        data.intended_use || "",
        data.team_size || 1,
        data.equipment_requirements || "All-Inclusive Commercial Kitchen Facility",
        data.status || "pending_approval",
        data.additional_notes || ""
      ]);

      // Automated confirmation email to customer with payment instructions
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
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Time & Duration:</td><td style="padding: 8px 0; font-weight: bold;">' + (data.start_time || '09:00') + ' AWST (' + duration + ' Hours)</td></tr>' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Business / ABN:</td><td style="padding: 8px 0; font-weight: bold;">' + (data.business_name || 'N/A') + ' (' + (data.abn || 'ABN on file') + ')</td></tr>' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Rental Total:</td><td style="padding: 8px 0; font-weight: bold; color: #112F21;">$' + total.toFixed(2) + ' AUD (incl. GST)</td></tr>' +
                '<tr style="border-bottom: 1px solid #F3F4F6;"><td style="padding: 8px 0; color: #6B7280;">Security Bond:</td><td style="padding: 8px 0; font-weight: bold;">$' + bond.toFixed(2) + ' AUD (refundable)</td></tr>' +
                '<tr><td style="padding: 8px 0; color: #6B7280;">Kitchen Access:</td><td style="padding: 8px 0; font-weight: bold; color: #166534;">All-Inclusive Commercial Kitchen Cookline</td></tr>' +
              '</table>' +
              '<div style="background: #F8FAF8; border: 1px solid #D1E5D5; border-radius: 10px; padding: 16px; margin: 20px 0;">' +
                '<h4 style="margin: 0 0 10px 0; color: #112F21; font-size: 14px;">💳 Bank Transfer & PayID Details</h4>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>Bank:</strong> Commonwealth Bank of Australia</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>Account Name:</strong> Daily Drop Commercial Kitchens Pty Ltd</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>BSB:</strong> 066-125</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>Account Number:</strong> 1098 7654</p>' +
                '<p style="margin: 3px 0; font-size: 12px;"><strong>PayID:</strong> payments@dailydrop.today</p>' +
                '<p style="margin: 6px 0 0; font-size: 12px; color: #ED8533;"><strong>Reference to quote:</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold;">' + refCode + '</span></p>' +
              '</div>' +
              '<p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin-bottom: 0;">' +
                'Questions? Contact our kitchen manager on <strong>0479 175 705</strong> or email <strong>hello@dailydrop.today</strong>.' +
              '</p>' +
            '</div>' +
          '</div>';

          MailApp.sendEmail({
            to: customerEmail,
            subject: emailSubject,
            htmlBody: emailHtml
          });
        } catch (mailErr) {
          Logger.log("Email notification error: " + mailErr.toString());
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        reference_code: refCode,
        message: "Booking saved successfully in Google Sheets"
      })).setMimeType(ContentService.MimeType.JSON);

    // ==========================================
    // ACTION: CREATE STORAGE BOOKING (MAX 2 BAYS)
    // ==========================================
    } else if (action === "create_storage_booking") {
      var storageSheet = ss.getSheetByName("Storage");
      var refCode = data.reference_code || ("DD-ST-" + Math.floor(10000 + Math.random() * 90000));
      var bayNum = Number(data.bay_number) || 1;
      var total = Number(data.total_price) || 220;
      var bond = Number(data.security_deposit) || 200;

      var cleanPhone = data.phone ? String(data.phone) : "";
      if (cleanPhone && cleanPhone.indexOf("'") !== 0) cleanPhone = "'" + cleanPhone;

      storageSheet.appendRow([
        timestamp,
        refCode,
        data.full_name || "",
        data.business_name || "N/A",
        data.abn || "N/A",
        data.email || "",
        cleanPhone,
        data.storage_type || "cool_room",
        bayNum,
        data.start_date || "",
        data.end_date || "",
        Number(data.duration_days) || 30,
        total.toFixed(2),
        bond.toFixed(2),
        data.status || "pending_approval",
        data.special_requirements || ""
      ]);

      // Confirmation email for storage
      if (data.email) {
        try {
          var customerEmail = String(data.email).trim();
          var custName = data.full_name || "Valued Tenant";
          var emailSubject = "Storage Bay Request Received (" + refCode + ") - Daily Drop";
          var emailHtml = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E8F4EC; border-radius: 12px; overflow: hidden; background: #ffffff;">' +
            '<div style="background-color: #112F21; color: #ffffff; padding: 24px; text-align: center;">' +
              '<h2 style="margin: 0; font-size: 20px;">DAILY DROP COMMERCIAL STORAGE</h2>' +
              '<p style="margin: 6px 0 0; color: #ED8533; font-size: 13px;">Unit 1, 1 Lichfield St, Victoria Park, Perth WA</p>' +
            '</div>' +
            '<div style="padding: 24px;">' +
              '<h3 style="color: #112F21; margin-top: 0;">Storage Bay Reservation #' + refCode + '</h3>' +
              '<p style="font-size: 13px; color: #374151;">Hi <strong>' + custName + '</strong>, your commercial storage space reservation (Bay #' + bayNum + ') is pending payment.</p>' +
              '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">' +
                '<tr><td style="padding: 6px 0; color: #6B7280;">Storage Type:</td><td style="padding: 6px 0; font-weight: bold;">' + (data.storage_type || 'Cool Room') + '</td></tr>' +
                '<tr><td style="padding: 6px 0; color: #6B7280;">Dates:</td><td style="padding: 6px 0; font-weight: bold;">' + (data.start_date || '') + ' to ' + (data.end_date || '') + '</td></tr>' +
                '<tr><td style="padding: 6px 0; color: #6B7280;">Rental Total:</td><td style="padding: 6px 0; font-weight: bold; color: #112F21;">$' + total.toFixed(2) + ' AUD</td></tr>' +
                '<tr><td style="padding: 6px 0; color: #6B7280;">Security Bond:</td><td style="padding: 6px 0; font-weight: bold;">$' + bond.toFixed(2) + ' AUD</td></tr>' +
              '</table>' +
              '<div style="background: #F8FAF8; border: 1px solid #D1E5D5; border-radius: 10px; padding: 16px; margin: 16px 0;">' +
                '<h4 style="margin: 0 0 8px 0; color: #112F21; font-size: 13px;">💳 Payment Details (CBA)</h4>' +
                '<p style="margin: 2px 0; font-size: 12px;"><strong>BSB:</strong> 066-125 | <strong>Acc:</strong> 1098 7654</p>' +
                '<p style="margin: 2px 0; font-size: 12px;"><strong>PayID:</strong> payments@dailydrop.today</p>' +
                '<p style="margin: 4px 0 0; font-size: 12px; color: #ED8533;"><strong>Ref:</strong> ' + refCode + '</p>' +
              '</div>' +
            '</div>' +
          '</div>';

          MailApp.sendEmail({
            to: customerEmail,
            subject: emailSubject,
            htmlBody: emailHtml
          });
        } catch (err) {}
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        reference_code: refCode,
        message: "Storage booking saved successfully"
      })).setMimeType(ContentService.MimeType.JSON);

    // ==========================================
    // ACTION: SUBMIT CUSTOM ENQUIRY
    // ==========================================
    } else if (action === "submit_enquiry") {
      var enquiriesSheet = ss.getSheetByName("Enquiries");
      var enqRef = data.reference_code || ("DD-ENQ-" + Math.floor(10000 + Math.random() * 90000));
      
      var cleanPhone = data.phone ? String(data.phone) : "";
      if (cleanPhone && cleanPhone.indexOf("'") !== 0) cleanPhone = "'" + cleanPhone;

      enquiriesSheet.appendRow([
        timestamp,
        enqRef,
        data.full_name || data.name || "",
        data.business_name || "N/A",
        data.email || "",
        cleanPhone,
        data.preferred_contact || "Email",
        data.rental_type || data.business_type || "General Enquiry",
        data.registered_in_victoria_park ? "Yes" : "No",
        data.message || "",
        "new"
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        reference_code: enqRef,
        message: "Enquiry saved successfully in Google Sheets"
      })).setMimeType(ContentService.MimeType.JSON);

    // ==========================================
    // ACTION: UPDATE STATUS
    // ==========================================
    } else if (action === "update_booking_status") {
      var bookingsSheet = ss.getSheetByName("Bookings");
      var rows = bookingsSheet.getDataRange().getDisplayValues();
      var targetRef = data.reference_code || "";
      var found = false;

      for (var i = 1; i < rows.length; i++) {
        if (rows[i][1] === targetRef) {
          if (data.status) bookingsSheet.getRange(i + 1, 18).setValue(data.status);
          if (data.admin_notes) bookingsSheet.getRange(i + 1, 19).setValue(data.admin_notes);
          found = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: found ? "success" : "not_found",
        message: found ? "Booking status updated" : "Booking not found"
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

// Handle GET requests (Strictly uses getDisplayValues to eliminate timezone conversion bugs)
function doGet(e) {
  setupSheetHeaders();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) || "get_all";

  try {
    // 1. GET BOOKINGS
    if (action === "get_bookings" || action === "get_all") {
      var sheet = ss.getSheetByName("Bookings");
      // getDisplayValues returns exact cell strings without Date object timezone shifts!
      var displayRows = sheet.getDataRange().getDisplayValues();
      var bookings = [];
      
      for (var i = 1; i < displayRows.length; i++) {
        var r = displayRows[i];
        if (!r[1]) continue;

        bookings.push({
          id: i,
          created_at: r[0],
          reference_code: r[1],
          full_name: r[2],
          business_name: r[3],
          abn: r[4],
          email: r[5],
          phone: r[6],
          booking_date: r[7],
          start_time: r[8],
          duration_hours: Number(r[9]) || 4,
          base_cost: Number(r[10]) || 0,
          cleaning_fee: 0,
          security_deposit: Number(r[13]) || 750,
          total_cost: Number(r[12]) || 0,
          intended_use: r[14],
          team_size: Number(r[15]) || 1,
          equipment_requirements: r[16],
          status: r[17] || "pending",
          additional_notes: r[18] || ""
        });
      }

      if (action === "get_bookings") {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: bookings }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. GET STORAGE BOOKINGS
    if (action === "get_storage_bookings") {
      var sheet = ss.getSheetByName("Storage");
      var displayRows = sheet.getDataRange().getDisplayValues();
      var storageBookings = [];

      for (var i = 1; i < displayRows.length; i++) {
        var r = displayRows[i];
        if (!r[1]) continue;

        storageBookings.push({
          id: i,
          created_at: r[0],
          reference_code: r[1],
          full_name: r[2],
          business_name: r[3],
          abn: r[4],
          email: r[5],
          phone: r[6],
          storage_type: r[7],
          bay_number: Number(r[8]) || 1,
          start_date: r[9],
          end_date: r[10],
          duration_days: Number(r[11]) || 30,
          total_price: Number(r[12]) || 220,
          security_deposit: Number(r[13]) || 200,
          status: r[14] || "pending",
          special_requirements: r[15] || ""
        });
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: storageBookings }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. GET ENQUIRIES
    if (action === "get_enquiries") {
      var sheet = ss.getSheetByName("Enquiries");
      var displayRows = sheet.getDataRange().getDisplayValues();
      var enquiries = [];

      for (var i = 1; i < displayRows.length; i++) {
        var r = displayRows[i];
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
          status: r[10] || "new"
        });
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: enquiries }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Daily Drop Google Sheet Webhook is active (Australia/Perth timezone verified)"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
