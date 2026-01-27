const express = require('express');
const multer = require('multer');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const azureBlobService = require('../services/azureBlobService');
const assignmentsDao = require('../dao/assignmentsDao');
const { listConfirmedUsersByEvent } = require('../dao/eventEnrollmentsDao');
const { createSubmission, findByAssignmentAndUser, updateSubmissionTimeByAssignmentUser, updateGradeByAssignmentUser, listByAssignmentId } = require('../dao/assignmentSubmissionsDao');
const { findUserByRole, findByUserId } = require('../dao/usersDao');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

console.log('[HOMEWORK ROUTER] Initializing...');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        cb(null, true);
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

// List assignments for an event
router.get('/events/:eventId/assignments', authMiddleware, async (req, res) => {
    try {
        const { eventId } = req.params;
        const assignments = await assignmentsDao.listByEventId(eventId);
        res.json({ assignments });
    } catch (error) {
        console.error('List assignments error:', error);
        res.status(500).json({ error: '獲取功課失敗' });
    }
});

// Create assignment
router.post('/assignments', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { event_id, name, description, deadline } = req.body || {};
        if (!event_id) {
            return res.status(400).json({ error: '缺少必要參數: event_id' });
        }
        const created = await assignmentsDao.createAssignment({
            event_id,
            assigned_by_id: req.user.sub,
            name,
            description,
            deadline
        });
        res.json({ assignment: created });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: '新增功課失敗' });
    }
});

// Update assignment
router.put('/assignments/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, deadline } = req.body || {};
        const updated = await assignmentsDao.updateAssignment(id, { name, description, deadline });
        res.json({ assignment: updated });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ error: '更新功課失敗' });
    }
});

// Delete assignment
router.delete('/assignments/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await assignmentsDao.removeByAssignmentId(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: '刪除功課失敗' });
    }
});

// Upload a homework file
router.post('/homework/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未選擇檔案' });
        }

        const { assignmentId, eventId } = req.body;
        const studentId = req.user.sub; // Get user ID from JWT token (sub field)
        
        if (!assignmentId || !eventId) {
            return res.status(400).json({ error: '缺少必要參數: eventId 或 assignmentId' });
        }
        
        // Only allow one file per user per assignment
        const existingFiles = await azureBlobService.listHomeworkFilesForStudent(eventId, assignmentId, studentId);
        if (existingFiles.success && Array.isArray(existingFiles.files) && existingFiles.files.length > 0) {
            return res.status(400).json({ error: '每個功課只可提交一個檔案，如需更改請先刪除原有檔案' });
        }

        // Upload file using Azure Blob Storage service (eventId_assignmentId folder + eventId_assignmentId_studentId filename)
        const uploadResult = await azureBlobService.uploadHomeworkFile(req.file, eventId, assignmentId, studentId);
        
        if (uploadResult.success) {
            const now = new Date().toISOString();
            const existingSubmission = await findByAssignmentAndUser(assignmentId, studentId);
            if (!existingSubmission) {
                await createSubmission({
                    assignment_id: assignmentId,
                    user_id: studentId,
                    submission_time: now,
                    upload_id: null,
                    status: 'SUBMITTED'
                });
            } else {
                await updateSubmissionTimeByAssignmentUser(assignmentId, studentId, now);
            }

            // Notify admins via webapp when a homework is uploaded
            try {
                const { createNotification } = require('../dao/notificationsDao');

                const assignment = await assignmentsDao.findByAssignmentId(assignmentId);
                const student = await findByUserId(studentId);

                const admins = await findUserByRole('ADMIN');
                const subject = '功課已提交通知';
                const lines = [
                    '有學生已上載功課檔案。',
                    '',
                    assignment ? `功課名稱：${assignment.name || ''}` : `功課 ID：${assignmentId}`,
                    `活動 ID：${eventId}`,
                    student ? `學生：${student.name} (ID: ${student.user_id})` : `學生 ID：${studentId}`,
                    `檔案名稱：${uploadResult.originalName}`
                ].filter(Boolean);
                const text = lines.join('\n');

                for (const admin of admins || []) {
                    await createNotification({
                        user_id: admin.user_id,
                        description: text,
                        template: subject
                    });
                }
            } catch (notifyError) {
                console.error('Failed to create admin homework upload notifications:', notifyError);
            }
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
        const { assignmentId, eventId } = req.query;
        if (!assignmentId || !eventId) {
            return res.status(400).json({ error: '缺少必要參數: eventId 或 assignmentId' });
        }

        const submission = await findByAssignmentAndUser(assignmentId, studentId);
        const hasGrade = Boolean(submission && (submission.score != null || submission.feedback));

        const filesResult = await azureBlobService.listHomeworkFilesForStudent(eventId, assignmentId, studentId);
        
        if (filesResult.success) {
            res.json({
                success: true,
                files: (filesResult.files || []).map((file) => ({
                    fileName: file.name,
                    url: file.url,
                    originalName: file.metadata?.originalName || file.name.split('/').pop(),
                    submittedAt: file.metadata?.uploadDate
                        || (file.properties?.lastModified ? new Date(file.properties.lastModified).toISOString() : null),
                    graded: hasGrade,
                    score: submission?.score ?? null,
                    feedback: submission?.feedback ?? null
                }))
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

// Admin: list submitted vs pending users for an assignment
router.get('/homework/admin/submissions', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
    try {
        const { eventId, assignmentId } = req.query;
        if (!eventId || !assignmentId) {
            return res.status(400).json({ error: '缺少必要參數: eventId 或 assignmentId' });
        }

        const users = await listConfirmedUsersByEvent(Number(eventId));
        const submissionRows = await listByAssignmentId(assignmentId);
        const submissionMap = new Map();
        (submissionRows || []).forEach((row) => {
            submissionMap.set(String(row.user_id), row);
        });
        const filesResult = await azureBlobService.listHomeworkFilesForAssignment(eventId, assignmentId);
        if (!filesResult.success) {
            return res.status(500).json({ error: filesResult.error || '獲取功課檔案失敗' });
        }

        const submittedMap = new Map();
        (filesResult.files || []).forEach((file) => {
            const pathParts = file.name.split('/');
            const baseName = pathParts[pathParts.length - 1];
            const studentIdFromPath = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : null;
            const studentId = file.metadata?.studentId || studentIdFromPath;
            if (!studentId) return;
            const submittedAt = file.metadata?.uploadDate
                || (file.properties?.lastModified ? new Date(file.properties.lastModified).toISOString() : null);
            submittedMap.set(String(studentId), {
                fileName: file.name,
                url: file.url,
                originalName: file.metadata?.originalName || baseName,
                submittedAt
            });
        });

        const submitted = [];
        const pending = [];
        users.forEach((user) => {
            const file = submittedMap.get(String(user.user_id));
            const submission = submissionMap.get(String(user.user_id));
            const graded = Boolean(submission && (submission.score != null || submission.feedback));
            if (file) {
                submitted.push({
                    user,
                    file,
                    graded,
                    score: submission?.score ?? null,
                    feedback: submission?.feedback ?? null
                });
            } else {
                pending.push({
                    user,
                    graded,
                    score: submission?.score ?? null,
                    feedback: submission?.feedback ?? null
                });
            }
        });

        return res.json({ submitted, pending });
    } catch (error) {
        console.error('Admin submission list error:', error);
        return res.status(500).json({ error: '獲取提交清單失敗' });
    }
});

// Admin: grade homework submission
router.put('/homework/admin/grade', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { assignmentId, userId, score, feedback } = req.body || {};
        if (!assignmentId || !userId) {
            return res.status(400).json({ error: '缺少必要參數: assignmentId 或 userId' });
        }

        const existing = await findByAssignmentAndUser(assignmentId, userId);
        if (!existing) {
            return res.status(404).json({ error: '找不到提交紀錄' });
        }

        const updated = await updateGradeByAssignmentUser(assignmentId, userId, {
            score: score == null || score === '' ? null : Number(score),
            feedback: feedback || null,
            graded_by_id: req.user.sub
        });
        // After grading, notify the student by email + webapp
        try {
            const { createNotification } = require('../dao/notificationsDao');

            const assignment = await assignmentsDao.findByAssignmentId(assignmentId);
            const student = await findByUserId(userId);

            if (student) {
                const to = student.email;
                const subject = '功課批改結果通知';
                const displayScore =
                    updated.score == null || Number.isNaN(Number(updated.score))
                        ? '未評分'
                        : String(updated.score);
                const lines = [
                    '你的功課已由導師批改。',
                    '',
                    assignment ? `功課名稱：${assignment.name || ''}` : `功課 ID：${assignmentId}`,
                    `分數：${displayScore}`,
                    updated.feedback ? `老師評語：${updated.feedback}` : ''
                ].filter(Boolean);
                const text = lines.join('\n');

                if (to) {
                    await sendEmail({
                        to,
                        subject,
                        text
                    });
                }

                await createNotification({
                    user_id: student.user_id,
                    description: text,
                    template: subject
                });
            }
        } catch (notifyError) {
            console.error('Failed to send homework grading notification:', notifyError);
        }

        return res.json({ submission: updated });
    } catch (error) {
        console.error('Grade submission error:', error);
        return res.status(500).json({ error: '批改失敗' });
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

// Delete a homework file (query param) — safer for filenames containing slashes
router.delete('/homework/file', authMiddleware, async (req, res) => {
    try {
        const fileName = req.query.fileName;
        if (!fileName) {
            return res.status(400).json({ error: '缺少檔案名稱' });
        }
        const decodedName = decodeURIComponent(fileName);

        const deleteResult = await azureBlobService.deleteFile(decodedName, 'homework');

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
        console.error('Delete file (query) error:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// Download a file (query param)
router.get('/homework/download', authMiddleware, async (req, res) => {
    try {
        const fileName = req.query.fileName;
        if (!fileName) {
            return res.status(400).json({ error: '缺少檔案名稱' });
        }
        const decodedName = decodeURIComponent(fileName);
        const fileContent = await azureBlobService.downloadFile(decodedName, 'homework');

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

// Download a file (wildcard path for slashes)
router.get('/homework/download/*', authMiddleware, async (req, res) => {
    try {
        const rawName = req.params[0];
        if (!rawName) {
            return res.status(400).json({ error: '缺少檔案名稱' });
        }
        const decodedName = decodeURIComponent(rawName);
        const fileContent = await azureBlobService.downloadFile(decodedName, 'homework');

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
        console.error('Download file error (wildcard):', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

// Download a file (path param, legacy)
router.get('/homework/download/:fileName', authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;
        const decodedName = decodeURIComponent(fileName);
        
        const fileContent = await azureBlobService.downloadFile(decodedName, 'homework');
        
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