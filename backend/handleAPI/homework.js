const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const azureBlobService = require('../services/azureBlobService');

const router = express.Router();

// JWT 設定
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';

// 身份驗證中間件
function authMiddleware(req, res, next) {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// 配置 multer 使用記憶體儲存
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // 允許的檔案類型
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
            cb(new Error('不支援的檔案類型'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    }
});

// 上傳作業檔案
router.post('/homework/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未選擇檔案' });
        }

        const { assignmentId } = req.body;
        const studentId = req.user.sub; // 從 JWT token 中獲取用戶 ID (sub 欄位)
        
        if (!assignmentId) {
            return res.status(400).json({ error: '缺少必要參數: assignmentId' });
        }

        // 使用 Azure Blob Storage 服務上傳檔案
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
        console.error('上傳作業錯誤:', error);
        
        if (error.message === '不支援的檔案類型') {
            return res.status(400).json({ error: '不支援的檔案類型' });
        }
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '檔案大小超過限制 (10MB)' });
        }
        
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// 獲取學生的作業檔案列表
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
        console.error('獲取檔案列表錯誤:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// 刪除作業檔案
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
        console.error('刪除檔案錯誤:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// 獲取檔案 URL
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
        console.error('獲取檔案 URL 錯誤:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

module.exports = router;