const ALLOWED_PROGRAMS = [
  "AI Explorers (Ages 7-10)",
  "Code Champions (Ages 11-14)",
  "Not sure yet",
];

const ALLOWED_SCHEDULES = [
  "Weekdays (Mon-Fri, 1hr/day)",
  "Weekends (Fri-Sun, 1hr 45min/session)",
];

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^[0-9+\-() ]{7,20}$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .slice(0, 500);
}

// Neutralizes spreadsheet formula injection (a value starting with
// =, +, -, or @ can be interpreted as a formula by Sheets/Excel).
function sheetSafe(str) {
  const s = escapeHtml(str).trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isNonEmptyString(v, maxLen) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= (maxLen || 500);
}

function validateCommon(body) {
  const errors = [];

  if (body.website && String(body.website).length > 0) {
    return { honeypot: true, errors: [] };
  }

  if (typeof body.form_time === "number") {
    const elapsed = Date.now() - body.form_time;
    if (elapsed < 800) errors.push("Please take a moment to fill out the form.");
  }

  return { honeypot: false, errors };
}

function validateTrialBooking(body) {
  const { honeypot, errors } = validateCommon(body);
  if (honeypot) return { honeypot: true, errors: [] };

  if (!isNonEmptyString(body.childName, 200)) errors.push("Child's name is required.");
  if (!isNonEmptyString(body.parentName, 200)) errors.push("Parent's name is required.");
  if (!isNonEmptyString(body.email, 200) || !EMAIL_RE.test(String(body.email).trim().toLowerCase()))
    errors.push("A valid email address is required.");
  if (!isNonEmptyString(body.phone, 30) || !PHONE_RE.test(String(body.phone).trim()))
    errors.push("A valid phone number is required.");

  const age = Number(body.age);
  if (!Number.isInteger(age) || age < 5 || age > 18) errors.push("A valid child age is required.");

  if (!ALLOWED_PROGRAMS.includes(body.program)) errors.push("Please select a valid program.");
  if (!ALLOWED_SCHEDULES.includes(body.timeslot)) errors.push("Please select a valid schedule.");

  return { honeypot: false, errors };
}

function validateContact(body) {
  const { honeypot, errors } = validateCommon(body);
  if (honeypot) return { honeypot: true, errors: [] };

  if (!isNonEmptyString(body.name, 200)) errors.push("Name is required.");
  if (!isNonEmptyString(body.email, 200) || !EMAIL_RE.test(String(body.email).trim().toLowerCase()))
    errors.push("A valid email address is required.");
  if (body.phone && !PHONE_RE.test(String(body.phone).trim())) errors.push("Phone number looks invalid.");
  if (!isNonEmptyString(body.message, 2000)) errors.push("Message is required.");

  return { honeypot: false, errors };
}

function validateNewsletter(body) {
  const { honeypot, errors } = validateCommon(body);
  if (honeypot) return { honeypot: true, errors: [] };

  if (!isNonEmptyString(body.email, 200) || !EMAIL_RE.test(String(body.email).trim().toLowerCase()))
    errors.push("A valid email address is required.");

  return { honeypot: false, errors };
}

function checkOrigin(req) {
  const allowed = (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true; // not configured — don't block

  const origin = req.headers.origin || req.headers.referer || "";
  if (!origin) return true; // some legit clients omit these headers

  return allowed.some((a) => origin.startsWith(a)) || /\.vercel\.app/.test(origin);
}

module.exports = {
  escapeHtml,
  sheetSafe,
  validateTrialBooking,
  validateContact,
  validateNewsletter,
  checkOrigin,
};
