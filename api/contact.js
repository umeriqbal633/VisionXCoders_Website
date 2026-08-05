const { validateContact, sheetSafe, checkOrigin } = require("./_lib/validate");
const { submitToSheet } = require("./_lib/sheets");
const { sendOwnerContactNotification, sendParentContactConfirmation } = require("./_lib/email");

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
  const { honeypot, errors } = validateContact(body);

  if (honeypot) {
    res.status(200).json({ status: "success" });
    return;
  }

  if (errors.length > 0) {
    res.status(400).json({ status: "error", message: errors[0], errors });
    return;
  }

  const timestamp = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
  const data = {
    name: sheetSafe(body.name),
    email: String(body.email).trim().toLowerCase(),
    phone: sheetSafe(body.phone || ""),
    subject: sheetSafe(body.subject || "General Inquiry"),
    message: sheetSafe(body.message),
    timestamp,
  };

  try {
    await submitToSheet("contact-inquiry", data);
  } catch (err) {
    console.error("[contact] Sheets append failed:", err);
    res.status(500).json({ status: "error", message: "Could not send your message. Please email us directly at visionxcoders@gmail.com." });
    return;
  }

  try {
    await Promise.all([
      sendOwnerContactNotification(data),
      sendParentContactConfirmation(data),
    ]);
  } catch (err) {
    console.error("[contact] Email send failed:", err);
  }

  res.status(200).json({ status: "success" });
};
