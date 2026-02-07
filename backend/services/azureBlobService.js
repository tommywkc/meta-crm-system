const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');
require('dotenv').config();

// Azure Blob Storage helper: upload, delete, download and list files with metadata

class AzureBlobService {
    constructor() {
        const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!conn) {
            // Allow the app to start even when Blob Storage isn't configured (e.g. in some environments)
            console.warn('[AzureBlobService] AZURE_STORAGE_CONNECTION_STRING not set; file features are disabled.');
            this.blobServiceClient = null;
        } else {
            this.blobServiceClient = BlobServiceClient.fromConnectionString(conn);
        }
        // Define container configuration
        this.containers = {
            homework: 'homework-files',
            portfolio: 'portfolio-files',
            certificates: 'certificate-files',
            receipts: 'receipt-files',
            studentWorks: 'student-work-files'
        };
    }

    ensureConfigured() {
        if (!this.blobServiceClient) {
            return {
                success: false,
                error: 'Azure Blob Storage 未設定 (missing AZURE_STORAGE_CONNECTION_STRING)'
            };
        }
        return { success: true };
    }

    getSasUrl(blobUrl) {
        if (!process.env.AZURE_STORAGE_CONNECTION_STRING) return blobUrl;

        try {
            // Parse connection string to get key and account name
            const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
            const accountMatch = conn.match(/AccountName=([^;]+)/);
            const keyMatch = conn.match(/AccountKey=([^;]+)/);
            
            if (!accountMatch || !keyMatch) return blobUrl;
            
            const accountName = accountMatch[1];
            const accountKey = keyMatch[1];
            const credential = new StorageSharedKeyCredential(accountName, accountKey);

            // Parse blob URL to get container and blob name
            // Example: https://account.blob.core.windows.net/container/path/to/blob
            const url = new URL(blobUrl);
            const pathParts = url.pathname.split('/').filter(p => p.length > 0);
            
            if (pathParts.length < 2) return blobUrl;
            
            const containerName = pathParts[0];
            const blobName = decodeURIComponent(pathParts.slice(1).join('/'));

            const permissions = BlobSASPermissions.parse("r"); // Read permission
            const expiresOn = new Date(new Date().valueOf() + 86400 * 1000); // 24 hours

            const sasToken = generateBlobSASQueryParameters({
                containerName,
                blobName,
                permissions,
                expiresOn
            }, credential).toString();

            return `${blobUrl}?${sasToken}`;
        } catch (e) {
            console.error('SAS generation failed', e);
            return blobUrl;
        }
    }

    /**
     * Generic upload for Student Work Wall (and potentially others)
     */
    async uploadGenericFile(containerKey, fileBuffer, fileName, mimeType) {
        const check = this.ensureConfigured();
        if (!check.success) return check;

        try {
            // Use key mapping from containers
            let containerName = this.containers[containerKey] || containerKey;

            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            // Ensure container exists
            await containerClient.createIfNotExists();
            
            // Determine blob name (just the filename with UUID, no folder prefix)
            const blobName = `${randomUUID()}-${fileName}`;

            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            
            // Upload
            await blockBlobClient.uploadData(fileBuffer, {
                blobHTTPHeaders: { blobContentType: mimeType }
            });

            return {
                success: true,
                url: blockBlobClient.url,
                blobName
            };
        } catch (err) {
            console.error('[AzureBlobService] Upload error:', err);
            return { success: false, error: err.message };
        }
    }

    async uploadFile(file, userId, resourceId, containerType = 'homework') {
        const notConfigured = this.ensureConfigured();
        if (notConfigured) return notConfigured;
        try {
            // generate a unique file name
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${userId}/${resourceId}/${randomUUID()}.${fileExtension}`;
            
            // get container client
            const containerName = this.containers[containerType];
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            
            // get block blob client
            const blobClient = containerClient.getBlockBlobClient(fileName);
            
            // upload file
            const uploadResponse = await blobClient.upload(file.buffer, file.size, {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype
                },
                metadata: {
                    originalName: file.originalname,
                    userId: userId,
                    resourceId: resourceId,
                    containerType: containerType,
                    uploadDate: new Date().toISOString()
                }
            });

            return {
                success: true,
                fileName: fileName,
                url: blobClient.url,
                originalName: file.originalname,
                size: file.size,
                uploadResponse
            };
        } catch (error) {
            console.error('Azure Blob Storage upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async uploadHomeworkFile(file, eventId, assignmentId, studentId) {
        const notConfigured = this.ensureConfigured();
        if (notConfigured) return notConfigured;
        try {
            const folderName = `${eventId}_${assignmentId}`;
            const fileName = `${folderName}/${studentId}/${file.originalname}`;

            const containerName = this.containers.homework;
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(fileName);

            const uploadResponse = await blobClient.upload(file.buffer, file.size, {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype
                },
                metadata: {
                    originalName: file.originalname,
                    eventId: String(eventId),
                    assignmentId: String(assignmentId),
                    studentId: String(studentId),
                    uploadDate: new Date().toISOString()
                },
                overwrite: true
            });

            return {
                success: true,
                fileName,
                url: blobClient.url,
                originalName: file.originalname,
                size: file.size,
                uploadResponse
            };
        } catch (error) {
            console.error('Azure Blob Storage homework upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async uploadCertificateFile(file, eventId, userId) {
        const notConfigured = this.ensureConfigured();
        if (notConfigured) return notConfigured;
        try {
            const fileName = `${eventId}/${userId}/${file.originalname}`;

            const containerName = this.containers.certificates;
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(fileName);

            const uploadResponse = await blobClient.upload(file.buffer, file.size, {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype
                },
                metadata: {
                    originalName: file.originalname,
                    eventId: String(eventId),
                    userId: String(userId),
                    uploadDate: new Date().toISOString()
                },
                overwrite: true
            });

            return {
                success: true,
                fileName,
                url: blobClient.url,
                originalName: file.originalname,
                size: file.size,
                uploadResponse
            };
        } catch (error) {
            console.error('Azure Blob Storage certificate upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async uploadReceiptFile(file, eventId, userId) {
        const notConfigured = this.ensureConfigured();
        if (notConfigured) return notConfigured;
        try {
            const fileName = `${eventId}/${userId}/${file.originalname}`;

            const containerName = this.containers.receipts;
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(fileName);

            const uploadResponse = await blobClient.upload(file.buffer, file.size, {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype
                },
                metadata: {
                    originalName: file.originalname,
                    eventId: String(eventId),
                    userId: String(userId),
                    uploadDate: new Date().toISOString()
                },
                overwrite: true
            });

            return {
                success: true,
                fileName,
                url: blobClient.url,
                originalName: file.originalname,
                size: file.size,
                uploadResponse
            };
        } catch (error) {
            console.error('Azure Blob Storage receipt upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteFile(fileName, containerType = 'homework') {
        const configCheck = this.ensureConfigured();
        if (!configCheck.success) return configCheck;
        try {
            const containerName = this.containers[containerType];
            console.log(`[AzureBlobService] Deleting file: ${fileName} from container: ${containerName}`);
            
            if (!containerName) {
                throw new Error(`Invalid container type: ${containerType}`);
            }

            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(fileName);
            
            // Check if exists first to be sure
            const exists = await blobClient.exists();
            console.log(`[AzureBlobService] Blob exists before delete? ${exists}`);
            
            if (!exists) {
                return { success: true, message: 'Blob already does not exist' };
            }

            // Delete blob and its snapshots if any
            const deleteResponse = await blobClient.delete({ deleteSnapshots: 'include' });
            console.log(`[AzureBlobService] Delete response requestId: ${deleteResponse.requestId}`);

            return {
                success: true,
                deleteResponse
            };
        } catch (error) {
            console.error('Azure Blob Storage delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getFileUrl(fileName, containerType = 'homework') {
        const configCheck = this.ensureConfigured();
        if (!configCheck.success) return configCheck;
        try {
            const containerName = this.containers[containerType];
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(fileName);
            
            return {
                success: true,
                url: blobClient.url
            };
        } catch (error) {
            console.error('Azure Blob Storage get URL error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async downloadFile(fileName, containerType = 'homework') {
        const configCheck = this.ensureConfigured();
        if (!configCheck.success) return configCheck;
        try {
            const containerName = this.containers[containerType];
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(fileName);
            
            // download file content
            const downloadResponse = await blobClient.download();
            
            // read all data from the stream
            const chunks = [];
            if (downloadResponse.readableStreamBody) {
                // Readable stream in Node.js
                for await (const chunk of downloadResponse.readableStreamBody) {
                    chunks.push(chunk);
                }
            } else {
                // If there's no readableStreamBody, use blobBody directly
                chunks.push(downloadResponse.blobBody);
            }
            
            const fileBuffer = Buffer.isBuffer(chunks[0]) 
                ? Buffer.concat(chunks) 
                : Buffer.from(chunks[0]);
            
            return {
                success: true,
                data: fileBuffer,
                contentType: downloadResponse.contentType,
                originalName: downloadResponse.metadata?.originalName || downloadResponse.metadata?.originalname || fileName.split('/').pop(),
                metadata: downloadResponse.metadata || {}
            };
        } catch (error) {
            console.error('Azure Blob Storage download error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listFiles(userId, resourceId = null, containerType = 'homework') {
        const configCheck = this.ensureConfigured();
        if (!configCheck.success) return configCheck;
        try {
            const containerName = this.containers[containerType];
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const prefix = resourceId ? `${userId}/${resourceId}/` : `${userId}/`;
            
            const files = [];
            for await (const blob of containerClient.listBlobsFlat({ prefix })) {
                files.push({
                    name: blob.name,
                    url: `${containerClient.url}/${blob.name}`,
                    properties: blob.properties,
                    metadata: blob.metadata
                });
            }
            
            return {
                success: true,
                files
            };
        } catch (error) {
            console.error('Azure Blob Storage list files error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listHomeworkFilesForStudent(eventId, assignmentId, studentId) {
        const notConfigured = this.ensureConfigured();
        if (notConfigured) return notConfigured;
        try {
            const folderName = `${eventId}_${assignmentId}`;
            const containerName = this.containers.homework;
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const prefix = `${folderName}/${studentId}/`;

            const files = [];
            for await (const blob of containerClient.listBlobsFlat({ prefix })) {
                files.push({
                    name: blob.name,
                    url: `${containerClient.url}/${blob.name}`,
                    properties: blob.properties,
                    metadata: blob.metadata
                });
            }

            return {
                success: true,
                files
            };
        } catch (error) {
            console.error('Azure Blob Storage list homework files error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listHomeworkFilesForAssignment(eventId, assignmentId) {
        const notConfigured = this.ensureConfigured();
        if (notConfigured) return notConfigured;
        try {
            const folderName = `${eventId}_${assignmentId}`;
            const containerName = this.containers.homework;
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const prefix = `${folderName}/`;

            const files = [];
            for await (const blob of containerClient.listBlobsFlat({ prefix })) {
                files.push({
                    name: blob.name,
                    url: `${containerClient.url}/${blob.name}`,
                    properties: blob.properties,
                    metadata: blob.metadata
                });
            }

            return {
                success: true,
                files
            };
        } catch (error) {
            console.error('Azure Blob Storage list homework assignment files error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listAllFiles(containerType = 'homework') {
        const configCheck = this.ensureConfigured();
        if (!configCheck.success) return configCheck;
        try {
            const containerName = this.containers[containerType];
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            
            const files = [];
            for await (const blob of containerClient.listBlobsFlat()) {
                // get full properties for the blob, including metadata
                const blobClient = containerClient.getBlockBlobClient(blob.name);
                const properties = await blobClient.getProperties();
                
                files.push({
                    name: blob.name,
                    url: `${containerClient.url}/${blob.name}`,
                    properties: properties,
                    metadata: properties.metadata
                });
            }
            
            return {
                success: true,
                files
            };
        } catch (error) {
            console.error('Azure Blob Storage list all files error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new AzureBlobService();