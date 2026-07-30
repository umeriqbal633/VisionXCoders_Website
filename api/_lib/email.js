const { Resend } = require("resend");

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL || "VisionX Coders <onboarding@resend.dev>";
}

function ownerRecipients() {
  return (process.env.OWNER_NOTIFY_EMAIL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendOwnerBookingNotification(data) {
  const resend = getClient();
  const waNumber = String(data.phone || "").replace(/[^0-9]/g, "");
  const waLink = waNumber ? `https://wa.me/${waNumber}` : "https://wa.me/923295050039";

  const text = [
    "NEW TRIAL BOOKING — VisionX Coders",
    "",
    `Child Name    : ${data.childName}`,
    `Parent Name   : ${data.parentName}`,
    `Child Age     : ${data.age}`,
    `Program       : ${data.program}`,
    `Schedule      : ${data.timeslot}`,
    "",
    `Email         : ${data.email}`,
    `Phone         : ${data.phone}`,
    `Submitted     : ${data.timestamp}`,
    "",
    `WhatsApp the parent now: ${waLink}`,
  ].join("\n");

  await resend.emails.send({
    from: fromAddress(),
    to: ownerRecipients(),
    replyTo: data.email,
    subject: `New Trial Booking — ${data.childName} | VisionX Coders`,
    text,
  });
}

async function sendParentBookingConfirmation(data) {
  const resend = getClient();
  const text = [
    `Hi ${data.parentName},`,
    "",
    `Thanks for booking a free trial class for ${data.childName} with VisionX Coders!`,
    "",
    `Program : ${data.program}`,
    `Schedule: ${data.timeslot}`,
    "",
    "We'll WhatsApp you at " + data.phone + " within 30 minutes to confirm a time.",
    "",
    "If you have questions in the meantime, reply to this email or message us on WhatsApp: https://wa.me/923295050039",
    "",
    "— The VisionX Coders Team",
  ].join("\n");

  await resend.emails.send({
    from: fromAddress(),
    to: data.email,
    subject: "Your VisionX Coders free trial request is confirmed",
    text,
  });
}

async function sendOwnerContactNotification(data) {
  const resend = getClient();
  const text = [
    "NEW CONTACT INQUIRY — VisionX Coders",
    "",
    `From    : ${data.name}`,
    `Subject : ${data.subject}`,
    "",
    "Message:",
    data.message,
    "",
    `Email : ${data.email}`,
    `Phone : ${data.phone || "—"}`,
    `Time  : ${data.timestamp}`,
  ].join("\n");

  await resend.emails.send({
    from: fromAddress(),
    to: ownerRecipients(),
    replyTo: data.email,
    subject: `New Inquiry — ${data.subject} | VisionX Coders`,
    text,
  });
}

async function sendParentContactConfirmation(data) {
  const resend = getClient();
  const text = [
    `Hi ${data.name},`,
    "",
    "Thanks for reaching out to VisionX Coders! We've received your message and will reply within 24 hours.",
    "",
    "For anything urgent, message us on WhatsApp: https://wa.me/923295050039",
    "",
    "— The VisionX Coders Team",
  ].join("\n");

  await resend.emails.send({
    from: fromAddress(),
    to: data.email,
    subject: "We received your message — VisionX Coders",
    text,
  });
}

async function sendNewsletterConfirmation(email) {
  const resend = getClient();
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "You're in! Welcome to the VisionX Coders newsletter",
    text: "Thanks for subscribing! We'll send tips, updates, and early access to new VisionX Coders programs. No spam, unsubscribe anytime.",
  });
}

module.exports = {
  sendOwnerBookingNotification,
  sendParentBookingConfirmation,
  sendOwnerContactNotification,
  sendParentContactConfirmation,
  sendNewsletterConfirmation,
};
