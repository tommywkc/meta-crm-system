const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load .env from backend root (scripts/../.env)

async function debugDelete() {
    console.log('--- Starting Debug Delete Script ---');
    
    // 1. Check Connection String
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!conn) {
        console.error('ERROR: AZURE_STORAGE_CONNECTION_STRING is missing in .env');
        return;
    }
    console.log('Connection string found (first 10 chars):', conn.substring(0, 10) + '...');

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(conn);
        const containerName = 'student-work-files';
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // 2. Check Container
        const containerExists = await containerClient.exists();
        console.log(`Container "${containerName}" exists?`, containerExists);
        if (!containerExists) {
            console.error('Container does not exist!');
            return;
        }

        // 3. TARGET FILE (From your log)
        // b6c3d1a0-4c00-4baf-a9af-125f085a6fd3-1212.png
        const blobName = 'dcbe5117-2523-4f5a-80d4-74c9302e7c32-4.png';
        const blobClient = containerClient.getBlockBlobClient(blobName);

        console.log(`Checking blob: ${blobName}`);
        
        // 4. Check if Blob Exists
        const blobExists = await blobClient.exists();
        console.log(`Blob exists?`, blobExists);

        if (blobExists) {
            console.log('Attempting to delete...');
            const response = await blobClient.delete({ deleteSnapshots: 'include' });
            console.log('Delete response requestId:', response.requestId);
            console.log('Delete operation return code:', response._response.status);
            
            // 5. Verify Deletion
            const existsAfter = await blobClient.exists();
            console.log(`Blob exists AFTER delete?`, existsAfter);
        } else {
            console.log('Blob was NOT found. It might be already deleted or the name is slightly different.');
            
            // List all files to see if there's a mismatch
            console.log('\nListing files in container to check for name mismatch:');
            for await (const blob of containerClient.listBlobsFlat()) {
                console.log(` - ${blob.name}`);
            }
        }

    } catch (error) {
        console.error('EXCEPTION:', error.message);
        console.error(error);
    }
}

debugDelete();