import { CronJob } from "cron";
import prisma from "../prisma.js"; // adjust path if needed
export const startCronJobs = () => {
    // Daily cron
    console.log("cron job function has been called");
    new CronJob('*/30 * * * *', async () => {
        try {
            const updatedCount = await prisma.event.updateMany({
                where: {
                    isPrevious: false,
                    endDateTime: { lt: new Date() },
                },
                data: { isPrevious: true },
            });
            console.log(`✅ Updated ${updatedCount.count} previous events at ${new Date().toISOString()}`);
        }
        catch (error) {
            console.error('❌ Daily cron job failed:', error);
        }
    }, null, true, "Asia/Kolkata");
    console.log('✅ Cron jobs scheduled: Daily + 30-minute job active');
};
