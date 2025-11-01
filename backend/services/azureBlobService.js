const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class AzureBlobService {
    constructor() {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        // 定義容器配置
        this.containers = {
            homework: 'homework-files',
            portfolio: 'portfolio-files',
            certificates: 'certificate-files'
        };
    }

    async uploadFile(file, userId, resourceId, containerType = 'homework') {
        try {
            // 生成唯一的檔案名稱
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${userId}/${resourceId}/${uuidv4()}.${fileExtension}`;
            
            // 獲取容器客戶端
            const containerName = this.containers[containerType];
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            
            // 獲取 blob 客戶端
            const blobClient = containerClient.getBlockBlobClient(fileName);
            
            // 上傳檔案
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

    async deleteFile(fileName, containerType = 'homework') {
        try {
            const containerName = this.containers[containerType];
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(fileName);
            
            const deleteResponse = await blobClient.delete();
            
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

    async listFiles(userId, resourceId = null, containerType = 'homework') {
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
}

module.exports = new AzureBlobService();