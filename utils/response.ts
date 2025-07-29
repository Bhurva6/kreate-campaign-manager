export class APIResponse {
  constructor(
    public code: number,
    public success: boolean,
    public message: string,
    public data?: any
  ) {}
}
