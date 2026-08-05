const { validateTestimonial, sheetSafe, checkOrigin } = require("./_lib/validate");
const { submitToSheet } = require("./_lib/sheets");
const { sendOwnerTestimonialNotification } = require("./_lib/email");

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
  const { honeypot, errors } = validateTestimonial(body);

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
    parentName: sheetSafe(body.parentName),
    city: sheetSafe(body.city),
    feedback: sheetSafe(body.feedback),
    rating: Number(body.rating),
    timestamp,
  };

  try {
    await submitToSheet("testimonial-review", data);
  } catch (err) {
    console.error("[testimonial] Sheets append failed:", err);
    res.status(500).json({ status: "error", message: "Could not submit your review. Please try again later." });
    return;
  }

  try {
    await sendOwnerTestimonialNotification(data);
  } catch (err) {
    console.error("[testimonial] Email send failed:", err);
  }

  res.status(200).json({ status: "success" });
};
