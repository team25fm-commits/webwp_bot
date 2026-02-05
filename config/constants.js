import dotenv from 'dotenv';
dotenv.config();

export const config = {
    drive: {
        pendingFolderId: process.env.PENDING_FOLDER_ID,
        doneFolderId: process.env.DONE_FOLDER_ID,
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
    },
    whatsapp: {
        groupName: process.env.WHATSAPP_GROUP_NAME,
        groupId: process.env.WHATSAPP_GROUP_ID,
    },
    schedule: {
        cron: process.env.SCHEDULE_TIME || '0 9 * * *',
        timezone: process.env.TZ || 'Asia/Kolkata',
    }
};

export const validateConfig = () => {
    const required = [
        'PENDING_FOLDER_ID',
        'DONE_FOLDER_ID',
        'GEMINI_API_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};
