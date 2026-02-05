import driveService from './services/driveService.js';
import { config } from './config/constants.js';

const checkCapabilities = async () => {
    try {
        await driveService.authenticate();
        const folderId = config.drive.pendingFolderId;

        console.log(`\n🔍 Checking Capabilities for Folder: ${folderId}`);

        const response = await driveService.drive.files.get({
            fileId: folderId,
            fields: 'capabilities, name, permissions',
        });

        const caps = response.data.capabilities;
        console.log(`📁 Folder Name: ${response.data.name}`);
        console.log(`--- Permissions ---`);
        console.log(`canAddChildren (Upload): ${caps.canAddChildren}`);
        console.log(`canListChildren (Read):  ${caps.canListChildren}`);
        console.log(`canTrashChildren (Delete): ${caps.canTrashChildren}`);

        if (!caps.canAddChildren) {
            console.log('\n❌ RESULT: You have READ-ONLY access.');
            console.log('Please change the role from "Viewer" to "Editor" for the email.');
        } else {
            console.log('\n✅ RESULT: You have EDITOR access! (Write is allowed)');
        }

    } catch (error) {
        console.error('Check Failed:', error.message);
    }
};

checkCapabilities();
