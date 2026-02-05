import driveService from './services/driveService.js';

const MAIN_FOLDER_ID = '1uwGuX_PdftcWqLc3A1fpCWAnd9VoxXR3';

const checkAccess = async () => {
    try {
        await driveService.authenticate();
        console.log(`Checking access to Main Folder: ${MAIN_FOLDER_ID}`);

        // 1. Try to get Main Folder Metadata
        try {
            const folder = await driveService.drive.files.get({
                fileId: MAIN_FOLDER_ID,
                fields: 'id, name, permissions',
            });
            console.log('✅ Main Folder Accessed!');
            console.log(`Name: ${folder.data.name}`);
        } catch (err) {
            console.error('❌ Failed to access Main Folder:', err.message);
        }

        // 2. List ANY file visible
        console.log('\nListing ANY files visible to Service Account:');
        const response = await driveService.drive.files.list({
            pageSize: 10,
            fields: 'files(id, name, mimeType, parents)',
        });

        if (response.data.files.length === 0) {
            console.log('⚠️ No files visible. The Service Account has NO access to anything.');
            console.log1('Please ensure you shared the folder with:');
            console.log('wp-bot-project@prefab-wave-486505-a0.iam.gserviceaccount.com');
        } else {
            console.log('--- Visible Files ---');
            response.data.files.forEach(f => {
                console.log(`[${f.mimeType}] ${f.name} (${f.id})`);
                if (f.parents) console.log(`   Parent: ${f.parents[0]}`);
            });
        }

    } catch (error) {
        console.error('System Error:', error.message);
    }
};

checkAccess();
