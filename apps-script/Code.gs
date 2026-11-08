// Paste into a new Google Apps Script project (script.google.com) and deploy as a web app.
// It emails you each interview transcript from your own Gmail. See README, "Email on every conversation".

// Who gets the emails. Leave empty to send to the Google account that owns this script.
const SEND_TO = "";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty("NOTIFY_SECRET");
    if (!secret || data.secret !== secret) return reply({ ok: false, error: "bad secret" });

    MailApp.sendEmail({
      to: SEND_TO || Session.getEffectiveUser().getEmail(),
      subject: String(data.subject).slice(0, 200),
      body: String(data.text),
      attachments: [Utilities.newBlob(String(data.attachment), "text/plain", String(data.filename))],
    });
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor (select it, press Run) to grant the email permission
// and send yourself a test message.
function testEmail() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Apps Script email works", "Test from the interview concept.");
}
