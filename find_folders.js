import driveService from './services/driveService.js';

const findFolders = async () => {
    try {
        await driveService.authenticate();

        console.log('Searching for folders...');
        const response = await driveService.drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name)',
        });

        const files = response.data.files;
        if (files.length) {
            console.log('--- Found Folders ---');
            files.forEach((file) => {
                console.log(`Name: ${file.name} | ID: ${file.id}`);
            });
            console.log('---------------------');
        } else {
            console.log('No folders found. Please ensure you shared them with the service account email.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

findFolders();
