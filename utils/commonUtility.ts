// Utility for API responses
export class APIResponse {
  constructor(
    public code: number,
    public success: boolean,
    public message: string,
    public data?: any
  ) {}
}

// Helper function for directory filename (simplified version)
export const dirFileName = (filename: string): string => {
  return filename.split('/').pop() || 'unknown';
};
