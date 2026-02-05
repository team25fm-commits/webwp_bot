import driveService from './services/driveService.js';
import { config } from './config/constants.js';

const uploadTest = async () => {
    try {
        await driveService.authenticate();
        console.log(`\n📤 Attempting to upload test file to Folder ID: ${config.drive.pendingFolderId}`);

        const fileMetadata = {
            'name': 'bot_access_test.txt',
            'parents': [config.drive.pendingFolderId]
        };

        const media = {
            mimeType: 'text/plain',
            body: 'Hello! If you see this file, the bot has WRITE access.'
        };

        const file = await driveService.drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });

        console.log(`✅ Success! File uploaded with ID: ${file.data.id}`);
        console.log('Please check your Google Drive Pending folder for "bot_access_test.txt".');

    } catch (error) {
        console.error('❌ Upload Failed:', error.message);
        console.log('This confirms the Service Account DOES NOT have Editor access to this specific folder.');
    }
};

uploadTest();
