import driveService from './services/driveService.js';

const MAIN_FOLDER_ID = '1uwGuX_PdftcWqLc3A1fpCWAnd9VoxXR3';

const findSubFolders = async () => {
    try {
        await driveService.authenticate();

        console.log(`Searching inside Main Folder: ${MAIN_FOLDER_ID}...`);

        const response = await driveService.drive.files.list({
            q: `'${MAIN_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id, name)',
        });

        const files = response.data.files;
        if (files.length) {
            console.log('--- Found Subfolders ---');
            files.forEach((file) => {
                console.log(`Name: ${file.name} | ID: ${file.id}`);
            });
            console.log('------------------------');
        } else {
            console.log('No subfolders found inside the main folder.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

findSubFolders();
