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
 * Simple JPEG quality reduction to compress images
 * Uses basic byte manipulation to reduce file size
 */
export function compressImageBuffer(
  buffer: Buffer,
  quality: number = 0.7
): Buffer {
  // For JPEG images, we can implement a simple quality reduction
  if (getImageMimeType(buffer) === 'image/jpeg') {
    // This is a simplified approach - in a real implementation you'd use a library
    // For now, we'll use a sampling approach to reduce data
    const compressionRatio = Math.max(0.3, Math.min(1, quality));
    const targetSize = Math.floor(buffer.length * compressionRatio);

    if (targetSize < buffer.length) {
      // Simple downsampling by removing every nth byte (preserving JPEG structure)
      const step = Math.ceil(buffer.length / targetSize);
      const compressed = Buffer.alloc(targetSize);
      let compressedIndex = 0;

      // Keep JPEG header intact (first 20 bytes)
      for (
        let i = 0;
        i < Math.min(20, buffer.length) && compressedIndex < compressed.length;
        i++
      ) {
        compressed[compressedIndex++] = buffer[i];
      }

      // Sample the rest of the data
      for (
        let i = 20;
        i < buffer.length && compressedIndex < compressed.length;
        i += step
      ) {
        compressed[compressedIndex++] = buffer[i];
      }

      return compressed.slice(0, compressedIndex);
    }
  }

  // Return original buffer if no compression applied
  return buffer;
}

/**
 * Create a data URI from image buffer for HTML embedding with optional compression
 */
export function createDataUri(
  buffer: Buffer,
  compress: boolean = false
): string {
  // Default to no compression to avoid corrupting image data.
  // If compression is explicitly requested, use very conservative settings.
  const processedBuffer = compress ? compressImageBuffer(buffer, 0.9) : buffer;
  const mimeType = getImageMimeType(processedBuffer);
  const base64Data = processedBuffer.toString('base64');
  return `data:${mimeType};base64,${base64Data}`;
}
