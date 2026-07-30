const { google } = require("googleapis");

function loadCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
  // Accept either a raw JSON string or a base64-encoded JSON string.
  const jsonStr = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(jsonStr);
}

async function getSheetsClient() {
  const credentials = loadCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

const HEADERS = {
  "Trial Bookings": [
    "Timestamp", "Type", "Child Name", "Parent Name",
    "Email", "Phone", "Child Age", "Program", "Preferred Schedule", "Status",
  ],
  "Contact Inquiries": [
    "Timestamp", "Type", "Name", "Email", "Phone", "Subject", "Message", "Status",
  ],
  "Newsletter Subscribers": ["Timestamp", "Email"],
};

async function ensureSheetExists(sheets, spreadsheetId, tabName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets.some((s) => s.properties.title === tabName);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS[tabName]] },
  });
}

async function appendRow(tabName, row) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is not set");

  const sheets = await getSheetsClient();
  await ensureSheetExists(sheets, spreadsheetId, tabName);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

module.exports = { appendRow };
