import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import { config } from '../config/constants.js';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

class DriveService {
    constructor() {
        this.auth = null;
        this.drive = null;
    }

    async authenticate() {
        try {
            let authOptions;

            // Check if credentials are in ENV (for Render/Cloud deployment)
            if (process.env.GOOGLE_CREDENTIALS_JSON) {
                logger.info('Using credentials from environment variable');
                const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
                authOptions = {
                    credentials: credentials,
                    scopes: SCOPES,
                };
            } else {
                // Fallback to local file (for local development)
                const keyPath = path.resolve('credentials.json');
                if (!fs.existsSync(keyPath)) {
                    throw new Error('credentials.json not found and GOOGLE_CREDENTIALS_JSON env var not set');
                }
                logger.info('Using credentials from local file');
                authOptions = {
                    keyFile: keyPath,
                    scopes: SCOPES,
                };
            }

            this.auth = new google.auth.GoogleAuth(authOptions);
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            logger.info('Google Drive authenticated successfully');
        } catch (error) {
            logger.error(`Drive Auth Error: ${error.message}`);
            throw error;
        }
    }

    async getRandomImageFromPending() {
        try {
            const response = await this.drive.files.list({
                q: `'${config.drive.pendingFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
                fields: 'files(id, name, mimeType)',
            });

            const files = response.data.files;
            if (!files || files.length === 0) {
                logger.info('No images found in pending folder');
                return null;
            }

            // Pick random file
            const randomFile = files[Math.floor(Math.random() * files.length)];
            logger.info(`Selected file: ${randomFile.name} (${randomFile.id})`);
            return randomFile;

        } catch (error) {
            logger.error(`List Files Error: ${error.message}`);
            throw error;
        }
    }

    async downloadFile(fileId) {
        try {
            const response = await this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'arraybuffer' }
            );
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Download Error: ${error.message}`);
            throw error;
        }
    }

    async moveFileToDone(fileId) {
        try {
            // 1. Get current parents
            const file = await this.drive.files.get({
                fileId,
                fields: 'parents',
            });

            const previousParents = file.data.parents.join(',');

            // 2. Add to new parent, remove from old
            await this.drive.files.update({
                fileId,
                addParents: config.drive.doneFolderId,
                removeParents: previousParents,
                fields: 'id, parents',
            });

            logger.info(`File ${fileId} moved to Done folder`);
        } catch (error) {
            logger.error(`Move File Error: ${error.message}`);
            throw error;
        }
    }
}

export default new DriveService();
