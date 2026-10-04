export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "نشست شما پایان یافته؛ دوباره وارد شوید.";
    if (error.status === 403) return "اجازه انجام این کار را ندارید.";
    if (error.status === 409)
      return "محتوا هم‌زمان تغییر کرده است. نسخه تازه را دریافت و تغییرات را دوباره اعمال کنید.";
    if (error.status === 429) return "تعداد درخواست‌ها زیاد است. کمی صبر کنید.";
    return error.message;
  }
  return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
}
