import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import logger from '../utils/logger.js';
import { config } from '../config/constants.js';

class WhatsappService {
    constructor() {
        this.client = null;
        this.isReady = false;
    }

    createClient() {
        logger.info('Creating WhatsApp Client...');

        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                headless: true
            }
        });
    }

    initialize() {
        logger.info('Starting WhatsApp Client...');
        this.initializeEvents();
        return this.client.initialize();
    }

    initializeEvents() {
        this.client.on('qr', (qr) => {
            logger.info('QR RECEIVED. Scan this with WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            logger.info('WhatsApp Client is ready!');
            this.isReady = true;
        });

        this.client.on('authenticated', () => {
            logger.info('WhatsApp Authenticated successfully');
        });

        this.client.on('auth_failure', msg => {
            logger.error('WhatsApp Authentication failure', msg);
        });

        this.client.on('disconnected', (reason) => {
            logger.warn('WhatsApp disconnected:', reason);
            this.isReady = false;
        });
    }

    async findGroup(groupNameOrId) {
        const chats = await this.client.getChats();

        // Try precise match first (ID)
        const groupById = chats.find(chat => chat.id._serialized === groupNameOrId);
        if (groupById) return groupById;

        // Try loose match (Name)
        const groupByName = chats.find(chat => chat.isGroup && chat.name.toLowerCase().includes(groupNameOrId.toLowerCase()));

        return groupByName;
    }

    async sendImageMessage(groupNameOrId, imageBuffer, caption, mimeType = 'image/jpeg') {
        if (!this.isReady) {
            throw new Error('WhatsApp client is not ready yet');
        }

        try {
            const group = await this.findGroup(groupNameOrId);
            if (!group) {
                throw new Error(`Group '${groupNameOrId}' not found`);
            }

            const media = new MessageMedia(mimeType, imageBuffer.toString('base64'));

            await this.client.sendMessage(group.id._serialized, media, { caption });
            logger.info(`Message sent to ${group.name}`);

        } catch (error) {
            logger.error(`Send Message Error: ${error.message}`);
            throw error;
        }
    }

    async sendTextMessage(groupNameOrId, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp client is not ready yet');
        }

        try {
            const group = await this.findGroup(groupNameOrId);
            if (!group) {
                throw new Error(`Group '${groupNameOrId}' not found`);
            }

            await this.client.sendMessage(group.id._serialized, message);
            logger.info(`Text Message sent to ${group.name}`);

        } catch (error) {
            logger.error(`Send Text Error: ${error.message}`);
            throw error;
        }
    }

    // Helper to debug Groups
    async logGroups() {
        if (!this.isReady) return;
        const chats = await this.client.getChats();
        logger.info('--- AVAILABLE GROUPS ---');
        chats.forEach(chat => {
            if (chat.isGroup) {
                logger.info(`Name: ${chat.name} | ID: ${chat.id._serialized}`);
            }
        });
        logger.info('------------------------');
    }
}

export default new WhatsappService();
