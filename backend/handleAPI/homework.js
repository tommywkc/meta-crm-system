const express = require('express');
const multer = require('multer');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const azureBlobService = require('../services/azureBlobService');

const router = express.Router();

console.log('[HOMEWORK ROUTER] Initializing...');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // allowed MIME types
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            // keep the original message string because the code later compares error.message
            cb(new Error('不支援的檔案類型'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Health check endpoint — verify router is loaded
router.get('/homework/health', (req, res) => {
    console.log('[HOMEWORK ROUTER] Health check received');
    res.json({ 
        status: 'ok',
        message: 'Homework router is working',
        timestamp: new Date().toISOString()
    });
});

// Upload a homework file
router.post('/homework/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未選擇檔案' });
        }

    const { assignmentId } = req.body;
    const studentId = req.user.sub; // Get user ID from JWT token (sub field)
        
        if (!assignmentId) {
            return res.status(400).json({ error: '缺少必要參數: assignmentId' });
        }

    // Upload file using Azure Blob Storage service
    const uploadResult = await azureBlobService.uploadFile(req.file, studentId, assignmentId, 'homework');
        
        if (uploadResult.success) {
            res.json({
                success: true,
                message: '檔案上傳成功',
                data: {
                    fileName: uploadResult.fileName,
                    originalName: uploadResult.originalName,
                    url: uploadResult.url,
                    size: uploadResult.size
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: '上傳失敗',
                details: uploadResult.error
            });
        }
    } catch (error) {
        console.error('Upload homework error:', error);

        // Preserve the original error string used in logic checks elsewhere
        if (error.message === '不支援的檔案類型') {
            return res.status(400).json({ error: '不支援的檔案類型' });
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '檔案大小超過限制 (10MB)' });
        }

        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// Get all homework files (Admin only)
// This endpoint is prioritized earlier in routing for convenience
router.get('/homework/files/admin/all', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const filesResult = await azureBlobService.listAllFiles('homework');
        
        if (filesResult.success) {
            res.json({
                success: true,
                files: filesResult.files
            });
        } else {
            res.status(500).json({
                success: false,
                error: '獲取檔案列表失敗',
                details: filesResult.error
            });
        }
        } catch (error) {
        console.error('Get all homework files error:', error);
        res.status(500).json({ error: '伺服器錯誤', details: error.message });
    }
});

// Get a student's homework files
router.get('/homework/files', authMiddleware, async (req, res) => {
    try {
        const studentId = req.user.sub; // 從 JWT token 中獲取用戶 ID (sub 欄位)
        const { assignmentId } = req.query;
        
        const filesResult = await azureBlobService.listFiles(studentId, assignmentId, 'homework');
        
        if (filesResult.success) {
            res.json({
                success: true,
                files: filesResult.files
            });
        } else {
            res.status(500).json({
                success: false,
                error: '獲取檔案列表失敗',
                details: filesResult.error
            });
        }
    } catch (error) {
        console.error('Get file list error:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// Delete a homework file
router.delete('/homework/file/:fileName', authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;
        
        const deleteResult = await azureBlobService.deleteFile(fileName, 'homework');
        
        if (deleteResult.success) {
            res.json({
                success: true,
                message: '檔案刪除成功'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '刪除失敗',
                details: deleteResult.error
            });
        }
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// Download a file
router.get('/homework/download/:fileName', authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;
        
        const fileContent = await azureBlobService.downloadFile(fileName, 'homework');
        
        if (fileContent.success) {
            res.setHeader('Content-Type', fileContent.contentType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${fileContent.originalName}"`);
            res.send(fileContent.data);
        } else {
            res.status(500).json({
                success: false,
                error: '下載檔案失敗',
                details: fileContent.error
            });
        }
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// Get a file URL
router.get('/homework/file-url/:fileName', authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;
        
        const urlResult = await azureBlobService.getFileUrl(fileName, 'homework');
        
        if (urlResult.success) {
            res.json({
                success: true,
                url: urlResult.url
            });
        } else {
            res.status(500).json({
                success: false,
                error: '獲取檔案 URL 失敗',
                details: urlResult.error
            });
        }
    } catch (error) {
        console.error('Get file URL error:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

module.exports = router;