// Writes rows via the Google Apps Script Web App deployed from
// google-apps-script.js (see that file for setup instructions).
// This is a server-to-server call — the public form never talks to
// this URL directly, only our own /api/* endpoints do, after their
// own validation and spam checks have already run.

async function submitToSheet(type, payload) {
  const url = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  if (!url) throw new Error("GOOGLE_SHEETS_WEBAPP_URL is not set");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...payload }),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Apps Script responded with HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.status !== "success") {
    throw new Error(json.message || "Apps Script reported failure");
  }
}

module.exports = { submitToSheet };
