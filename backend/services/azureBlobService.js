const { BlobServiceClient } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');
require('dotenv').config();

// Azure Blob Storage helper: upload, delete, download and list files with metadata

class AzureBlobService {
    constructor() {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        // Define container configuration
        this.containers = {
            homework: 'homework-files',
            portfolio: 'portfolio-files',
            certificates: 'certificate-files'
        };
    }

    async uploadFile(file, userId, resourceId, containerType = 'homework') {
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

    async downloadFile(fileName, containerType = 'homework') {
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
                originalName: downloadResponse.metadata?.originalName || fileName.split('/').pop()
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

    async listAllFiles(containerType = 'homework') {
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