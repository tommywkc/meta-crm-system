const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    createBanner, 
    getAllBanners, 
    deleteBanner, 
    updateBannerCaption,
    getBannerByUrl
} = require('../dao/bannersDao');
const blobService = require('../services/azureBlobService');

const upload = multer({ storage: multer.memoryStorage() });

// Get all banners (Merged from DB and Azure Storage)
router.get('/', async (req, res) => {
    try {
        // 1. Get all DB records
        const dbBanners = await getAllBanners();
        
        // 2. Map DB records by blob name for easy lookup
        const dbMap = {};
        dbBanners.forEach(item => {
            if (item.image_url) {
                const blobName = item.image_url.split('/').pop();
                const decodedName = decodeURIComponent(blobName.split('?')[0]); 
                dbMap[decodedName] = item;
            }
        });

        // 3. List files from Azure
        const azureResult = await blobService.listAllFiles('banners');
        if (!azureResult.success) {
            // Check if it's just a missing container (which means no files)
            if (azureResult.error && azureResult.error.includes('ContainerNotFound')) {
                 return res.json({ success: true, banners: [] });
            }
            return res.status(500).json(azureResult);
        }

        // 4. Merge results
        const mergedList = azureResult.files.map(file => {
            const dbRecord = dbMap[file.name];
            
            // Try to generate SAS URL; fallback to public URL if failed
            let finalUrl = file.url;
            try {
                 const sasUrl = blobService.getSasUrl('banners', file.name);
                 if (sasUrl) finalUrl = sasUrl;
            } catch (err) {
                console.error('Error generating SAS for banner:', file.name, err);
            }

            return {
                id: dbRecord ? dbRecord.banner_id : null, 
                blobName: file.name,
                url: finalUrl,
                caption: dbRecord ? dbRecord.caption : '',
                created_at: dbRecord ? dbRecord.created_at : file.properties?.createdOn,
                created_by_name: dbRecord ? dbRecord.created_by_name : 'Unknown',
                contentType: file.properties?.contentType
            };
        });
        
        // 5. Sort by created_at desc
        mergedList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ success: true, banners: mergedList });
    } catch (error) {
        console.error('List banners error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload a new banner
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file provided' });
        }
        const { caption } = req.body;
        const userId = req.user.user_id;

        // 1. Upload to Azure
        const file = req.file;
        const result = await blobService.uploadGenericFile('banners', file.buffer, file.originalname, file.mimetype);

        if (!result.success) {
            return res.status(500).json(result);
        }

        // 2. Save metadata to DB
        // result.url is the SAS URL, we need base URL relative or just store the full thing.
        // Usually we store the clean URL without SAS token if we want permanent ref, 
        // OR we just store what helper returns. 
        // The helper `uploadGenericFile` returns `url` which includes SAS token? 
        // Let's check `uploadGenericFile`. It likely returns `blockBlobClient.url`. 
        // We will store that url.
        
        await createBanner(result.url, caption, userId);

        res.json({ success: true, message: 'Uploaded successfully' });
    } catch (error) {
        console.error('Upload banner error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a banner
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params; 
        
        // Check if ID is numeric (DB ID) or blob name (orphan file)?
        // Front end passes existing logic: likely the mapped ID. 
        // If ID is null (file exists in Azure but not DB), we might need to pass blobName.
        // For now assume all valid files have DB records or we handle blobName delete.
        
        let blobName = req.query.blobName;

        // 1. Delete from DB if ID is provided and > 0
        if (id && id !== 'null' && id !== 'undefined') {
             const deleted = await deleteBanner(id);
             // If we found the record, extract blob name to ensure we delete correct file
             if (deleted && deleted.image_url) {
                 const urlParts = deleted.image_url.split('/');
                 blobName = decodeURIComponent(urlParts.pop().split('?')[0]);
             }
        }

        // 2. Delete from Azure
        if (!blobName) {
            return res.status(400).json({ success: false, error: 'Cannot determine file to delete' });
        }
        
        const result = await blobService.deleteFile(blobName, 'banners');
        
        res.json(result);
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
