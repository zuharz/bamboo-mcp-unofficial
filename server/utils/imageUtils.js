/**
 * Image processing utilities for BambooHR photo handling
 *
 * This module provides utilities for:
 * - Detecting image format by examining byte headers (magic numbers)
 * - Converting file sizes to human-readable format
 * - Processing binary image data for display
 */
/**
 * Detect image format by examining the first few bytes (magic numbers)
 * Different image formats have distinctive byte patterns at the start
 */
export function detectImageType(buffer) {
    if (buffer.length < 4)
        return 'image/jpeg'; // Fallback for tiny buffers
    // Extract the first 4 bytes to check against known patterns
    const header = buffer.subarray(0, 4);
    // PNG files always start with these exact bytes: 89 50 4E 47
    if (header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47) {
        return 'image/png';
    }
    // JPEG files start with: FF D8 FF
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
        return 'image/jpeg';
    }
    // GIF files start with: 47 49 46 38 (which spells "GIF8" in ASCII)
    if (header[0] === 0x47 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x38) {
        return 'image/gif';
    }
    // WebP files start with: 52 49 46 46 (RIFF) and have WEBP at offset 8
    if (header[0] === 0x52 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x46) {
        // Check if it's WebP by looking at bytes 8-11
        if (buffer.length >= 12) {
            const webpHeader = buffer.subarray(8, 12);
            if (webpHeader[0] === 0x57 &&
                webpHeader[1] === 0x45 &&
                webpHeader[2] === 0x42 &&
                webpHeader[3] === 0x50) {
                return 'image/webp';
            }
        }
    }
    // Default to JPEG if we cannot identify the format
    return 'image/jpeg';
}
/**
 * Convert raw byte count to human-readable format
 * Helps users understand file sizes without doing mental math
 */
export function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024; // Standard binary conversion factor
    const sizes = ['B', 'KB', 'MB', 'GB']; // Extended to include GB for very large files
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    // Ensure we don't go beyond our sizes array
    const sizeIndex = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(1))} ${sizes[sizeIndex]}`;
}
/**
 * Validate that a buffer contains valid image data
 * Performs basic validation to ensure the buffer looks like an image
 */
export function validateImageBuffer(buffer) {
    if (!buffer || buffer.length === 0) {
        return { valid: false, reason: 'Empty buffer' };
    }
    if (buffer.length < 10) {
        return { valid: false, reason: 'Buffer too small to be a valid image' };
    }
    // Check if it matches any known image format
    const imageType = detectImageType(buffer);
    if (imageType === 'image/jpeg' && buffer.length < 4) {
        // This means we defaulted to JPEG but don't have enough data
        return { valid: false, reason: 'Unrecognized image format' };
    }
    return { valid: true };
}
/**
 * Create a data URI from image buffer
 * Combines MIME type detection with base64 encoding for embedding
 */
export function createDataUri(buffer) {
    const imageType = detectImageType(buffer);
    const base64Data = buffer.toString('base64');
    return `data:${imageType};base64,${base64Data}`;
}
/**
 * Get image dimensions estimate based on format
 * Note: This is a simplified estimate - real dimension detection would require
 * parsing the specific format headers, which is beyond our current scope
 */
export function getImageInfo(buffer) {
    const format = detectImageType(buffer);
    const size = buffer.length;
    const sizeFormatted = formatBytes(size);
    const dataUri = createDataUri(buffer);
    return {
        format,
        size,
        sizeFormatted,
        dataUri,
    };
}
