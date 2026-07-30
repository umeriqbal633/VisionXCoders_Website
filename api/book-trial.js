const { validateTrialBooking, sheetSafe, checkOrigin } = require("./_lib/validate");
const { appendRow } = require("./_lib/sheets");
const { sendOwnerBookingNotification, sendParentBookingConfirmation } = require("./_lib/email");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ status: "error", message: "Method not allowed" });
    return;
  }

  if (!checkOrigin(req)) {
    res.status(403).json({ status: "error", message: "Forbidden" });
    return;
  }

  const body = req.body || {};
  const { honeypot, errors } = validateTrialBooking(body);

  if (honeypot) {
    // Silent no-op success response for bots.
    res.status(200).json({ status: "success" });
    return;
  }

  if (errors.length > 0) {
    res.status(400).json({ status: "error", message: errors[0], errors });
    return;
  }

  const timestamp = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
  const data = {
    childName: sheetSafe(body.childName),
    parentName: sheetSafe(body.parentName),
    email: String(body.email).trim().toLowerCase(),
    phone: sheetSafe(body.phone),
    age: sheetSafe(body.age),
    program: sheetSafe(body.program),
    timeslot: sheetSafe(body.timeslot),
    timestamp,
  };

  try {
    await appendRow("Trial Bookings", [
      data.timestamp, "Trial Booking", data.childName, data.parentName,
      data.email, data.phone, data.age, data.program, data.timeslot, "New",
    ]);
  } catch (err) {
    console.error("[book-trial] Sheets append failed:", err);
    res.status(500).json({ status: "error", message: "Could not save your booking. Please WhatsApp us directly at +92 329 505 0039." });
    return;
  }

  // Email failures shouldn't fail the request — the booking is already saved.
  try {
    await Promise.all([
      sendOwnerBookingNotification(data),
      sendParentBookingConfirmation(data),
    ]);
  } catch (err) {
    console.error("[book-trial] Email send failed:", err);
  }

  res.status(200).json({ status: "success" });
};
