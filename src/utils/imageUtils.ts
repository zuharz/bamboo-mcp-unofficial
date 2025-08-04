/**
 * Simplified image utilities for BambooHR photo handling
 * Focuses on essential functionality while trusting BambooHR's data integrity
 */

/**
 * Get appropriate MIME type for image data URI
 * Simplified approach: BambooHR typically serves JPEG photos
 */
export function getImageMimeType(buffer: Buffer): string {
  // Quick header check for the most common formats
  if (buffer.length >= 4) {
    const header = buffer.subarray(0, 4);

    // PNG signature: 89 50 4E 47
    if (header[0] === 0x89 && header[1] === 0x50) {
      return 'image/png';
    }

    // JPEG signature: FF D8
    if (header[0] === 0xff && header[1] === 0xd8) {
      return 'image/jpeg';
    }
  }

  // Default to JPEG - BambooHR's most common format
  return 'image/jpeg';
}

/**
 * Convert raw byte count to human-readable format
 * Helps users understand file sizes without doing mental math
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024; // Standard binary conversion factor
  const sizes = ['B', 'KB', 'MB', 'GB']; // Extended to include GB for very large files
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Ensure we don't go beyond our sizes array
  const sizeIndex = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(1))} ${sizes[sizeIndex]}`;
}

/**
 * Basic validation for image buffer
 * Simple checks to ensure we have usable image data
 */
export function validateImageBuffer(buffer: Buffer): {
  valid: boolean;
  reason?: string;
} {
  if (!buffer || buffer.length === 0) {
    return { valid: false, reason: 'Empty buffer received from API' };
  }

  if (buffer.length < 10) {
    return { valid: false, reason: 'Buffer too small to be a valid image' };
  }

  return { valid: true };
}

/**
 * Create a data URI from image buffer for HTML embedding
 */
export function createDataUri(buffer: Buffer): string {
  const mimeType = getImageMimeType(buffer);
  const base64Data = buffer.toString('base64');
  return `data:${mimeType};base64,${base64Data}`;
}
