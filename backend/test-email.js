/**
 * DIAGNOSTIC TEST SCRIPT - CASH COMPASS EMAIL SYSTEM
 * Run this with: node test-email.js
 */
const emailService = require('./services/emailService');

const testUser = {
  name: "Rahamath Shaik",
  email: "rahamathshaik610@gmail.com"
};

async function runTests() {
  console.log("🚀 Starting Diagnostic Tests for Cash Compass Email System...");

  // 1. Test Welcome Email
  console.log("\n[1/4] Sending Welcome Email...");
  await emailService.sendWelcomeEmail(testUser);

  // 2. Test Login Alert
  console.log("\n[2/4] Sending Login Alert...");
  await emailService.sendLoginAlert(testUser, {
    time: new Date().toLocaleString(),
    device: "Chrome (Windows 11)",
    location: "Hyderabad, India"
  });

  // 3. Test Report Email
  console.log("\n[3/4] Sending Report Email...");
  await emailService.sendReportEmail(testUser, {
    name: "Weekly Spending Summary",
    highlights: "an 18% reduction in dining expenses!",
    category: "Restaurants",
    url: "http://localhost:5000/analytics.html"
  });

  // 4. Test Inactivity Email
  console.log("\n[4/4] Sending Inactivity Email...");
  await emailService.sendInactivityReminder(testUser);

  console.log("\n✅ All 4 diagnostic emails have been sent to " + testUser.email);
  console.log("Please check your inbox (including Spam folder).");
}

runTests();
