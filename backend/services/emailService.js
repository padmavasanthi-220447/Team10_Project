const { BrevoClient } = require('@getbrevo/brevo');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

/**
 * INITIALIZE BREVO CLIENT (v5.x SDK)
 */
const client = new BrevoClient({ 
    apiKey: process.env.BREVO_API_KEY 
});

/**
 * CORE REUSABLE FUNCTION: sendEmail (v5.x style)
 */
async function sendEmail(toEmail, subject, htmlContent) {
  try {
    const data = await client.transactionalEmails.sendTransacEmail({
      subject: subject,
      htmlContent: htmlContent,
      sender: { 
        name: process.env.SENDER_NAME || "Cash Compass", 
        email: process.env.SENDER_EMAIL 
      },
      to: [{ email: toEmail }]
    });

    console.log(`[Email Service] Success: Email sent to ${toEmail}.`);
    return { success: true, data };
  } catch (error) {
    console.error(`[Email Service] ERROR: Failed to send email to ${toEmail}.`, error.body || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to load and process templates
 */
function getTemplate(templateName, data) {
  const filePath = path.join(__dirname, '../templates', `${templateName}.html`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the {{key}} placeholders with actual data
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, data[key]);
  });
  
  return content;
}

/**
 * 1. EVENT: Welcome Email
 */
exports.sendWelcomeEmail = async (user) => {
  const html = getTemplate('welcome', {
    name: user.name,
    frontend_url: process.env.FRONTEND_URL || "http://localhost:5000"
  });
  return await sendEmail(user.email, "Welcome to Cash Compass 🧭", html);
};

/**
 * 2. EVENT: Login Alert
 */
exports.sendLoginAlert = async (user, loginInfo) => {
  const html = getTemplate('login_alert', {
    name: user.name,
    time: loginInfo.time || new Date().toLocaleString(),
    device: loginInfo.device || "Unknown Device",
    location: loginInfo.location || "Unknown Location",
    security_url: `${process.env.FRONTEND_URL}/security`
  });
  return await sendEmail(user.email, "New Login Detected 🔐", html);
};

/**
 * 3. EVENT: Report Insight Email
 */
exports.sendReportEmail = async (user, reportInfo) => {
  const html = getTemplate('report', {
    name: user.name,
    report_name: reportInfo.name || "Monthly Insight Report",
    highlights: reportInfo.highlights || "some unusual spending trends",
    category: reportInfo.category || "Dining/Leisure",
    report_url: reportInfo.url || `${process.env.FRONTEND_URL}/analytics`
  });
  return await sendEmail(user.email, "Your Report is Ready 📊", html);
};

/**
 * 4. EVENT: Inactive User Reminder
 */
exports.sendInactivityReminder = async (user) => {
  const html = getTemplate('inactivity', {
    name: user.name,
    login_url: `${process.env.FRONTEND_URL}/login`
  });
  return await sendEmail(user.email, "We Miss You at Cash Compass 🧭", html);
};

exports.sendEmailRaw = sendEmail;
