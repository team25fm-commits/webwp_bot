import cron from 'node-cron';
import { config, validateConfig } from './config/constants.js';
import logger from './utils/logger.js';
import driveService from './services/driveService.js';
import geminiService from './services/geminiService.js';
import whatsappService from './services/whatsappService.js';

// Validate Env Vars
try {
    validateConfig();
} catch (error) {
    logger.error(error.message);
    process.exit(1);
}

// --- Task 1: Morning Greeting (9:00 AM) ---
const runMorningGreeting = async () => {
    logger.info('Starting Morning Greeting Routine...');
    try {
        const message = await geminiService.generateMorningGreeting();
        const targetGroup = config.whatsapp.groupId || config.whatsapp.groupName;
        await whatsappService.sendTextMessage(targetGroup, message);
        logger.info('Morning Greeting Sent! ☀️');
    } catch (error) {
        logger.error(`Morning Greeting Failed: ${error.message}`);
    }
};

// --- Task 2: Image Post (10:30 AM) ---
const runImagePost = async () => {
    logger.info('Starting Daily Image Post Routine...');
    try {
        // 1. Get Image
        const file = await driveService.getRandomImageFromPending();
        if (!file) {
            logger.warn('Skipping run: No images in pending folder.');
            return;
        }

        // 2. Download Image
        const buffer = await driveService.downloadFile(file.id);
        const mimeType = file.mimeType || 'image/jpeg';

        // 3. Generate Caption
        const caption = await geminiService.generateDescription(buffer, mimeType);

        // 4. Send to WhatsApp
        const targetGroup = config.whatsapp.groupId || config.whatsapp.groupName;
        await whatsappService.sendImageMessage(targetGroup, buffer, caption, mimeType);

        // 5. Move to Done
        await driveService.moveFileToDone(file.id);

        logger.info('Daily Image Post Completed! 📸');

    } catch (error) {
        logger.error(`Image Post Failed: ${error.message}`);
    }
};

const start = async () => {
    try {
        // Initialize Services
        await driveService.authenticate();
        whatsappService.createClient(); // Must create client first!
        await whatsappService.initialize();

        // Print Group IDs on startup
        whatsappService.client.on('ready', () => {
            setTimeout(() => whatsappService.logGroups(), 5000);
        });

        // --- Schedules ---

        // 1. Morning Msg: Daily at 9:00 AM
        logger.info(`Scheduling Morning Msg at: 0 9 * * * (${config.schedule.timezone})`);
        cron.schedule('0 9 * * *', () => {
            runMorningGreeting();
        }, { timezone: config.schedule.timezone });

        // 2. Image Post: Daily at 10:30 AM
        logger.info(`Scheduling Image Post at: 30 10 * * * (${config.schedule.timezone})`);
        cron.schedule('30 10 * * *', () => {
            runImagePost();
        }, { timezone: config.schedule.timezone });

        // --- Manual Triggers ---
        if (process.argv.includes('--morning')) {
            logger.info('Manual trigger: Morning Greeting');
            const checkReady = setInterval(() => {
                if (whatsappService.isReady) {
                    clearInterval(checkReady);
                    runMorningGreeting();
                }
            }, 1000);
        }

        if (process.argv.includes('--post')) {
            logger.info('Manual trigger: Image Post');
            const checkReady = setInterval(() => {
                if (whatsappService.isReady) {
                    clearInterval(checkReady);
                    runImagePost();
                }
            }, 1000);
        }

    } catch (error) {
        logger.error(`Startup Error: ${error.message}`);
        process.exit(1);
    }
};

start();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await whatsappService.client.destroy();
    process.exit(0);
});
