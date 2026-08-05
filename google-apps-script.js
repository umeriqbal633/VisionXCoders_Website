/**
 * ================================================================
 *  VisionX Coders — Google Apps Script (Sheets writer)
 *
 *  Called server-to-server by the Vercel backend (/api/book-trial,
 *  /api/contact, /api/newsletter) — never called directly by the
 *  browser. Only responsible for appending rows to this
 *  spreadsheet; all validation, spam-filtering, and email
 *  notifications happen in the Vercel backend (via Resend).
 *
 *  SETUP (2 minutes):
 *  ─────────────────────────────────────────────────────────────
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. Delete any existing code in the editor, paste this whole file in
 *  3. Click Save (Ctrl+S)
 *  4. Click Deploy → New Deployment
 *     - Type: Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. Click Deploy → Authorize when prompted
 *     (click Advanced → Go to VisionX Coders (unsafe) → Allow —
 *     this is expected since the script isn't published publicly)
 *  6. Copy the Web app URL shown at the end and set it as the
 *     GOOGLE_SHEETS_WEBAPP_URL environment variable in Vercel
 * ================================================================
 */

var BOOKING_HEADERS = [
  "Timestamp", "Type", "Child Name", "Parent Name",
  "Email", "Phone", "Child Age", "Program", "Preferred Schedule", "Status"
];

var CONTACT_HEADERS = [
  "Timestamp", "Type", "Name", "Email", "Phone", "Subject", "Message", "Status"
];

var NEWSLETTER_HEADERS = ["Timestamp", "Email"];

var TESTIMONIAL_HEADERS = [
  "Timestamp", "Parent Name", "City", "Rating", "Feedback", "Status"
];

function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === "trial-booking") {
      var bookingSheet = getOrCreateSheet(ss, "Trial Bookings", BOOKING_HEADERS);
      bookingSheet.appendRow([
        data.timestamp || new Date().toLocaleString(),
        "Trial Booking",
        data.childName  || "",
        data.parentName || "",
        data.email      || "",
        data.phone      || "",
        data.age        || "",
        data.program    || "",
        data.timeslot   || "",
        "New"
      ]);
    } else if (data.type === "contact-inquiry") {
      var contactSheet = getOrCreateSheet(ss, "Contact Inquiries", CONTACT_HEADERS);
      contactSheet.appendRow([
        data.timestamp || new Date().toLocaleString(),
        "Contact Inquiry",
        data.name    || "",
        data.email   || "",
        data.phone   || "",
        data.subject || "General",
        data.message || "",
        "New"
      ]);
    } else if (data.type === "newsletter-signup") {
      var newsletterSheet = getOrCreateSheet(ss, "Newsletter Subscribers", NEWSLETTER_HEADERS);
      newsletterSheet.appendRow([
        data.timestamp || new Date().toLocaleString(),
        data.email || ""
      ]);
    } else if (data.type === "testimonial-review") {
      var testimonialSheet = getOrCreateSheet(ss, "Testimonials", TESTIMONIAL_HEADERS);
      testimonialSheet.appendRow([
        data.timestamp   || new Date().toLocaleString(),
        data.parentName  || "",
        data.city        || "",
        data.rating      || "",
        data.feedback    || "",
        "Pending Review"
      ]);
    } else {
      return jsonResponse({ status: "error", message: "Unknown submission type" });
    }

    return jsonResponse({ status: "success" });

  } catch (err) {
    Logger.log("Error: " + err.message);
    return jsonResponse({ status: "error", message: err.message });
  }
}

// ── Helper: Get or create a sheet with headers ────────────────
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground("#0866ff");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Arial");
    sheet.setFrozenRows(1);
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

  doPost({
    postData: {
      contents: JSON.stringify({
        type:       "trial-booking",
        childName:  "Ali Hassan",
        parentName: "Ahmed Hassan",
        email:      "test@test.com",
        phone:      "+923001234567",
        age:        "9",
        program:    "Junior Creator (Ages 7-10)",
        timeslot:   "Weekdays (Mon-Fri, 1hr/day)",
        timestamp:  new Date().toLocaleString()
      })
    }
  });

  Logger.log("Test booking added! Check your sheet.");
}
