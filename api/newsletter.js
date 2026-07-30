const { validateNewsletter, sheetSafe, checkOrigin } = require("./_lib/validate");
const { appendRow } = require("./_lib/sheets");
const { sendNewsletterConfirmation } = require("./_lib/email");

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
  const { honeypot, errors } = validateNewsletter(body);

  if (honeypot) {
    res.status(200).json({ status: "success" });
    return;
  }

  if (errors.length > 0) {
    res.status(400).json({ status: "error", message: errors[0], errors });
    return;
  }

  const email = String(body.email).trim().toLowerCase();
  const timestamp = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

  try {
    await appendRow("Newsletter Subscribers", [timestamp, sheetSafe(email)]);
  } catch (err) {
    console.error("[newsletter] Sheets append failed:", err);
    // Not fatal — still try to send the confirmation email.
  }

  try {
    await sendNewsletterConfirmation(email);
  } catch (err) {
    console.error("[newsletter] Email send failed:", err);
    res.status(500).json({ status: "error", message: "Something went wrong. Please try again." });
    return;
  }

  res.status(200).json({ status: "success" });
};
