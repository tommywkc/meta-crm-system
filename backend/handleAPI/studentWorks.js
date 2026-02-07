const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createStudentWork, getAllStudentWorks, deleteStudentWork } = require('../dao/studentWorksDao');
const blobService = require('../services/azureBlobService');

const upload = multer({ storage: multer.memoryStorage() });

// Get all works (Merged from DB and Azure Storage)
router.get('/', async (req, res) => {
    try {
        // 1. Get all DB records
        const dbWorks = await getAllStudentWorks();
        
        // 2. Map DB records by blob name for easy lookup
        const dbMap = {};
        dbWorks.forEach(work => {
            if (work.image_url) {
                // Extract blob name: https://.../container/blobName
                const blobName = work.image_url.split('/').pop();
                // Handle potential URL encoding
                const decodedName = decodeURIComponent(blobName.split('?')[0]); 
                dbMap[decodedName] = work;
            }
        });

        // 3. Get all files from Azure container
        const azureResult = await blobService.listAllFiles('studentWorks');
        let allBlobs = [];
        if (azureResult.success) {
            allBlobs = azureResult.files;
        } else {
            console.error('Failed to list Azure blobs:', azureResult.error);
            // Fallback: if Azure list fails, just return DB works? 
            // Or empty? Let's return DB works to be safe though images might be broken.
            const worksWithSas = dbWorks.map(work => ({
                ...work,
                image_url: blobService.getSasUrl(work.image_url) // Generate SAS even if list failed
            }));
            return res.json({ success: true, works: worksWithSas });
        }

        // 4. Merge Logic
        // We iterate over blobs because they are the "real" files.
        const mergedWorks = allBlobs.map(blob => {
            const blobName = blob.name;
            const dbRecord = dbMap[blobName];
            
            if (dbRecord) {
                // Found in DB: return full DB record
                return {
                    ...dbRecord,
                    image_url: blobService.getSasUrl(blob.url)
                };
            } else {
                // Not in DB: return "Virtual" work
                return {
                    work_id: `blob_${blobName}`, // Special ID for "blob-only" items
                    image_url: blobService.getSasUrl(blob.url),
                    caption: '', // No caption
                    created_at: blob.properties?.createdOn || new Date(),
                    created_by_name: 'System (Azure)',
                    is_virtual_blob: true // Flag for UI if needed
                };
            }
        });

        // 5. Sort by created time (newest first)
        mergedWorks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ success: true, works: mergedWorks });
    } catch (error) {
        console.error('Fetch student works error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch works' });
    }
});

// Create new work
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { caption } = req.body;
        const file = req.file;
        const userId = req.user ? req.user.user_id : null;

        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Upload to Azure
        const result = await blobService.uploadGenericFile('studentWorks', file.buffer, file.originalname, file.mimetype);
        
        if (!result.success) {
            return res.status(500).json({ success: false, message: 'Azure upload failed' });
        }

        const newWork = await createStudentWork(result.url, caption, userId);
        
        // Return work with SAS URL for immediate display
        const workWithSas = {
            ...newWork,
            image_url: blobService.getSasUrl(newWork.image_url)
        };
        
        res.json({ success: true, work: workWithSas });

    } catch (error) {
        console.error('Create student work error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if this is a "Virtual Blob" delete request
        if (id.startsWith('blob_')) {
            const blobName = id.substring(5); // Remove 'blob_' prefix
            console.log(`[DELETE] Deleting virtual blob: ${blobName}`);
            
            const result = await blobService.deleteFile(blobName, 'studentWorks');
            if (result.success) {
                return res.json({ success: true, message: 'Blob deleted successfully' });
            } else {
                return res.status(500).json({ success: false, message: 'Failed to delete blob from Azure' });
            }
        }
        
        // Normal DB + Azure delete logic
        // Delete from DB first and get the deleted record
        const deletedWork = await deleteStudentWork(id);

        if (!deletedWork) {
            return res.status(404).json({ success: false, message: 'Work not found' });
        }

        // Delete from Azure if image_url exists
        if (deletedWork.image_url) {
            try {
                // Extract blob name from URL
                const urlWithoutQuery = deletedWork.image_url.split('?')[0];
                const encodedBlobName = urlWithoutQuery.split('/').pop();
                const blobName = decodeURIComponent(encodedBlobName);
                
                console.log(`[DELETE] Legacy Delete - Blob Name: ${blobName}`);

                if (blobName) {
                    await blobService.deleteFile(blobName, 'studentWorks');
                }
            } catch (blobError) {
                console.error('Failed to delete blob from Azure:', blobError);
            }
        }
        
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete student work error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
});

module.exports = router;
