import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import cron from 'node-cron';

import { config, validateConfig } from './config/constants.js';
import logger from './utils/logger.js';
import driveService from './services/driveService.js';
import geminiService from './services/geminiService.js';
import whatsappService from './services/whatsappService.js';

// Validate Config
try {
    validateConfig();
} catch (error) {
    logger.error(`Config Error: ${error.message}`);
    process.exit(1);
}

// Setup Express
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'ok', whatsapp: whatsappService.isReady });
});

// Socket.IO connection
io.on('connection', (socket) => {
    logger.info('Dashboard client connected');

    // Send current status
    if (whatsappService.isReady) {
        socket.emit('ready');
    }

    // Handle manual triggers
    socket.on('trigger', async (type) => {
        if (!whatsappService.isReady) {
            socket.emit('log', '❌ WhatsApp not ready');
            return;
        }

        if (type === 'morning') {
            socket.emit('log', 'Running Morning Greeting...');
            await runMorningGreeting();
            socket.emit('log', '✅ Morning Greeting Sent!');
        } else if (type === 'post') {
            socket.emit('log', 'Running Image Post...');
            await runImagePost();
            socket.emit('log', '✅ Image Post Complete!');
        }
    });
});

// Broadcast function
const broadcast = (event, data) => {
    io.emit(event, data);
};

// --- Task 1: Morning Greeting (9:00 AM) ---
const runMorningGreeting = async () => {
    logger.info('Starting Morning Greeting Routine...');
    try {
        const message = await geminiService.generateMorningGreeting();
        const targetGroup = config.whatsapp.groupId || config.whatsapp.groupName;
        await whatsappService.sendTextMessage(targetGroup, message);
        logger.info('Morning Greeting Sent! ☀️');
        broadcast('log', '☀️ Morning Greeting Sent!');
    } catch (error) {
        logger.error(`Morning Greeting Failed: ${error.message}`);
        broadcast('log', `❌ Error: ${error.message}`);
    }
};

// --- Task 2: Image Post (10:30 AM) ---
const runImagePost = async () => {
    logger.info('Starting Daily Image Post Routine...');
    try {
        const file = await driveService.getRandomImageFromPending();
        if (!file) {
            logger.warn('Skipping run: No images in pending folder.');
            broadcast('log', '⚠️ No images in pending folder');
            return;
        }

        const buffer = await driveService.downloadFile(file.id);
        const mimeType = file.mimeType || 'image/jpeg';
        const caption = await geminiService.generateDescription(buffer, mimeType);
        const targetGroup = config.whatsapp.groupId || config.whatsapp.groupName;
        await whatsappService.sendImageMessage(targetGroup, buffer, caption, mimeType);
        await driveService.moveFileToDone(file.id);

        logger.info('Daily Image Post Completed! 📸');
        broadcast('log', '📸 Image Posted & Moved to Done!');

    } catch (error) {
        logger.error(`Image Post Failed: ${error.message}`);
        broadcast('log', `❌ Error: ${error.message}`);
    }
};

// --- WhatsApp Event Handlers ---
const setupWhatsAppEvents = () => {
    whatsappService.client.on('qr', async (qr) => {
        logger.info('QR Code received, sending to dashboard...');
        try {
            const qrDataUrl = await QRCode.toDataURL(qr, { width: 250 });
            broadcast('qr', qrDataUrl);
        } catch (err) {
            logger.error('QR generation error:', err);
        }
    });

    whatsappService.client.on('ready', () => {
        logger.info('WhatsApp Ready!');
        broadcast('ready');
        broadcast('log', '🟢 WhatsApp Connected');
    });

    whatsappService.client.on('disconnected', (reason) => {
        logger.warn(`WhatsApp Disconnected: ${reason}`);
        broadcast('disconnected');
        broadcast('log', `🔴 Disconnected: ${reason}`);
    });
};
// The setupWhatsAppEvents function is now integrated directly into the start function
// and is no longer needed as a separate function.

// --- Startup ---
const start = async () => {
    try {
        // Initialize Drive
        await driveService.authenticate();

        // Start HTTP Server first (for QR display)
        server.listen(PORT, () => {
            logger.info(`🌐 Dashboard running at http://localhost:${PORT}`);
        });

        // Create WhatsApp client
        whatsappService.createClient();

        // Add custom event handlers for dashboard (these run in ADDITION to service events)
        whatsappService.client.on('qr', async (qr) => {
            logger.info('QR Code received, sending to dashboard...');
            try {
                const qrDataUrl = await QRCode.toDataURL(qr, { width: 250 });
                broadcast('qr', qrDataUrl);
            } catch (err) {
                logger.error('QR generation error:', err);
            }
        });

        whatsappService.client.on('authenticated', () => {
            logger.info('WhatsApp Authenticated!');
            broadcast('authenticated');
            broadcast('log', '🟡 Authenticated! Loading data...');
        });

        whatsappService.client.on('ready', () => {
            broadcast('ready');
            broadcast('log', '🟢 WhatsApp Connected');
        });

        whatsappService.client.on('disconnected', (reason) => {
            broadcast('disconnected');
            broadcast('log', `🔴 Disconnected: ${reason}`);
        });

        // Initialize WhatsApp (will trigger events)
        await whatsappService.initialize();

        // --- Schedules ---
        logger.info(`Scheduling Morning Msg at: 0 9 * * * (${config.schedule.timezone})`);
        cron.schedule('0 9 * * *', runMorningGreeting, { timezone: config.schedule.timezone });

        logger.info(`Scheduling Image Post at: 30 10 * * * (${config.schedule.timezone})`);
        cron.schedule('30 10 * * *', runImagePost, { timezone: config.schedule.timezone });

    } catch (error) {
        logger.error(`Startup Error: ${error.message}`);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    whatsappService.client.destroy();
    server.close();
    process.exit(0);
});

start();
