/**
 * Progress tracking utilities for MCP 2025-06-18 compliance
 */
export function createProgressContext(progressToken) {
  return {
    token: progressToken,
    sendProgress: async (progress, total, message) => {
      try {
        // Mock progress notification for now
        if (progress && total && message) {
          console.log(`Progress: ${progress}/${total} - ${message}`);
        }
      } catch (error) {
        // Don't fail operation if progress notification fails
        console.error('[Progress] Notification failed:', error.message);
      }
    },
  };
}
export function extractProgressToken(request) {
  const token = request?.params?._meta?.progressToken;
  return typeof token === 'string' ? token : null;
}
