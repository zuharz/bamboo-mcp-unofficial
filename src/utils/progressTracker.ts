/**
 * Progress tracking utilities for MCP 2025-06-18 compliance
 */

export interface ProgressContext {
  token: string | null;
  sendProgress: (
    progress: number,
    total?: number,
    message?: string
  ) => Promise<void>;
}

export function createProgressContext(
  progressToken: string | null
): ProgressContext {
  return {
    token: progressToken,
    sendProgress: async (
      progress: number,
      total?: number,
      message?: string
    ) => {
      try {
        // Mock progress notification for now
        if (progress && total && message) {
          console.log(`Progress: ${progress}/${total} - ${message}`);
        }
      } catch (error) {
        // Don't fail operation if progress notification fails
        console.error(
          '[Progress] Notification failed:',
          (error as Error).message
        );
      }
    },
  };
}

export function extractProgressToken(request: any): string | null {
  return request?.params?._meta?.progressToken || null;
}
