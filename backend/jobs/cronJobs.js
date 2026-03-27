const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * DAILY INACTIVITY CHECK
 * Runs every day at midnight (00:00)
 */
const initCronJobs = () => {
    // Schedule: "At 00:00 every day"
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron Job] Starting daily inactivity check...');
        
        try {
            // Calculate 3 days ago
            const activeThreshold = new Date();
            activeThreshold.setDate(activeThreshold.getDate() - 3);
            
            // Find users whose lastLogin is older than 3 days
            // AND ensure they haven't been emailed recently (optional enhancement)
            const inactiveUsers = await User.find({
                lastLogin: { $lt: activeThreshold }
            });

            console.log(`[Cron Job] Found ${inactiveUsers.length} inactive users.`);

            for (const user of inactiveUsers) {
                if (user.email) {
                    await emailService.sendInactivityReminder(user);
                    console.log(`[Cron Job] Sent reminder to ${user.email}`);
                }
            }
            
            console.log('[Cron Job] Daily inactivity check completed.');
        } catch (error) {
            console.error('[Cron Job] Error in inactivity check:', error);
        }
    });

    console.log('[Cron Job] Scheduled: Daily Inactivity Check (Midnight)');
};

module.exports = { initCronJobs };
