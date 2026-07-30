/**
 * ================================================================
 *  DEPRECATED — kept only as a reference. Superseded by the
 *  Vercel serverless functions in /api (book-trial.js, contact.js),
 *  which handle the same Sheets-append + email-notification flow
 *  server-side. This file is no longer deployed or wired to
 *  anything live.
 * ================================================================
 *  VisionX Coders — Google Apps Script
 *  Receives form submissions and writes to Google Sheets + sends email
 *
 *  SETUP INSTRUCTIONS (5 minutes):
 *  ─────────────────────────────────────────────────────────────
 *  1. Go to https://sheets.google.com
 *  2. Create a new spreadsheet — name it "VisionX Coders — Bookings"
 *  3. In the spreadsheet, click: Extensions → Apps Script
 *  4. Delete ALL existing code in the editor
 *  5. Copy and paste THIS entire file into the editor
 *  6. Change NOTIFICATION_EMAIL below to iumer633@gmail.com
 *  7. Click Save (Ctrl+S)
 *  8. Click Deploy → New Deployment
 *     - Type: Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  9. Click Deploy → Authorize when asked (click Advanced → Go to VisionX)
 * 10. Copy the Web App URL shown at the end
 * 11. Paste that URL into main.js where it says SHEETS_URL = "YOUR_GOOGLE..."
 * ================================================================
 */

// ── CONFIGURATION ─────────────────────────────────────────────
var NOTIFICATION_EMAIL = "iumer633@gmail.com";  // Your email
var WHATSAPP_NUMBER    = "+92 329 505 0039";     // Your WhatsApp

// ── Sheet column headers (auto-created on first run) ──────────
var BOOKING_HEADERS = [
  "Timestamp", "Type", "Child Name", "Parent Name",
  "Email", "Phone", "Child Age", "Program",
  "Preferred Time", "Status"
];

var CONTACT_HEADERS = [
  "Timestamp", "Type", "Name", "Email",
  "Phone", "Subject", "Message", "Status"
];

// ═══════════════════════════════════════════════════════════════
//  Main handler — called on every form submission
// ═══════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === "trial-booking") {
      handleTrialBooking(ss, data);
    } else if (data.type === "contact-inquiry") {
      handleContactInquiry(ss, data);
    }

    return jsonResponse({ status: "success" });

  } catch (err) {
    Logger.log("Error: " + err.message);
    return jsonResponse({ status: "error", message: err.message });
  }
}

// ── Trial Booking Handler ─────────────────────────────────────
function handleTrialBooking(ss, data) {
  var sheet = getOrCreateSheet(ss, "Trial Bookings", BOOKING_HEADERS);

  // Write row to sheet
  sheet.appendRow([
    data.timestamp || new Date().toLocaleString(),
    "Trial Booking",
    data.childName  || "",
    data.parentName || "",
    data.email      || "",
    data.phone      || "",
    data.age        || "",
    data.program    || "",
    data.timeslot   || "",
    "New ⭐"  // Status — you can change this manually in the sheet
  ]);

  // Send email notification to you
  var subject = "🎓 New Trial Booking — " + (data.childName || "Unknown") + " | VisionX Coders";
  var body    = buildBookingEmail(data);

  MailApp.sendEmail({
    to:      NOTIFICATION_EMAIL,
    subject: subject,
    body:    body,
    replyTo: data.email || NOTIFICATION_EMAIL
  });
}

// ── Contact Inquiry Handler ───────────────────────────────────
function handleContactInquiry(ss, data) {
  var sheet = getOrCreateSheet(ss, "Contact Inquiries", CONTACT_HEADERS);

  sheet.appendRow([
    data.timestamp || new Date().toLocaleString(),
    "Contact Inquiry",
    data.name    || "",
    data.email   || "",
    data.phone   || "",
    data.subject || "General",
    data.message || "",
    "New 📩"
  ]);

  var subject = "📩 New Inquiry — " + (data.subject || "General") + " | VisionX Coders";
  var body    = buildContactEmail(data);

  MailApp.sendEmail({
    to:      NOTIFICATION_EMAIL,
    subject: subject,
    body:    body,
    replyTo: data.email || NOTIFICATION_EMAIL
  });
}

// ── Email Templates ───────────────────────────────────────────
function buildBookingEmail(d) {
  return [
    "═══════════════════════════════════",
    "  NEW TRIAL BOOKING — VisionX Coders",
    "═══════════════════════════════════",
    "",
    "  Child Name   : " + (d.childName  || "—"),
    "  Parent Name  : " + (d.parentName || "—"),
    "  Child Age    : " + (d.age        || "—"),
    "  Program      : " + (d.program    || "—"),
    "  Preferred Time: " + (d.timeslot  || "—"),
    "",
    "  📧 Email     : " + (d.email || "—"),
    "  📱 Phone     : " + (d.phone || "—"),
    "",
    "  ⏰ Submitted : " + (d.timestamp || "—"),
    "",
    "═══════════════════════════════════",
    "  NEXT STEP: WhatsApp the parent now!",
    "  https://wa.me/" + (d.phone || "").replace(/[^0-9]/g,""),
    "═══════════════════════════════════",
    "",
    "View all bookings: https://sheets.google.com"
  ].join("\n");
}

function buildContactEmail(d) {
  return [
    "═══════════════════════════════════",
    "  NEW CONTACT INQUIRY — VisionX Coders",
    "═══════════════════════════════════",
    "",
    "  From    : " + (d.name    || "—"),
    "  Subject : " + (d.subject || "—"),
    "",
    "  Message:",
    "  " + (d.message || "—"),
    "",
    "  📧 Email : " + (d.email || "—"),
    "  📱 Phone : " + (d.phone || "—"),
    "  ⏰ Time  : " + (d.timestamp || "—"),
    "",
    "═══════════════════════════════════",
    "  Reply directly to this email to respond.",
    "═══════════════════════════════════"
  ].join("\n");
}

// ── Helper: Get or create a sheet with headers ────────────────
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add header row with orange styling
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground("#f97316");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Arial");
    sheet.setFrozenRows(1);
    // Auto-resize columns
    for (var i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 150);
    }
  }
  return sheet;
}

// ── Helper: JSON response ─────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Test function — run this manually to test setup ───────────
function testSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  handleTrialBooking(ss, {
    type:       "trial-booking",
    childName:  "Ali Hassan",
    parentName: "Ahmed Hassan",
    email:      "test@test.com",
    phone:      "+923001234567",
    age:        "9",
    program:    "Spark Starters",
    timeslot:   "Evening (4:00 PM - 8:00 PM)",
    timestamp:  new Date().toLocaleString()
  });

  Logger.log("Test booking added! Check your sheet and email.");
}
