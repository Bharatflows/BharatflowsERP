/**
 * Cloudinary Service
 * Handles image and file uploads for BharatFlows
 * Credentials are loaded from environment variables:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from 'cloudinary';
import logger from '../config/logger';

// Initialise once on module load
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export function isCloudinaryConfigured(): boolean {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

/**
 * Upload a file buffer to Cloudinary
 * @param buffer   Raw file buffer (from multer memoryStorage)
 * @param folder   Cloudinary folder, e.g. "bharatflows/logos"
 * @param publicId Optional stable public ID (good for overwriting logos)
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    publicId?: string
): Promise<{ url: string; publicId: string }> {
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
    }

    return new Promise((resolve, reject) => {
        const uploadOptions: Record<string, any> = {
            folder,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
            uploadOptions.overwrite  = true;
        }

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error || !result) {
                    logger.error('[Cloudinary] Upload error:', error);
                    return reject(error || new Error('Upload failed'));
                }
                logger.info(`[Cloudinary] Uploaded: ${result.public_id}`);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );

        stream.end(buffer);
    });
}

/**
 * Delete a file from Cloudinary by its public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    if (!isCloudinaryConfigured()) return;

    try {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`[Cloudinary] Deleted: ${publicId}`);
    } catch (error) {
        logger.error('[Cloudinary] Delete error:', error);
    }
}

export default cloudinary;
