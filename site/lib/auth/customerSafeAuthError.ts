const TEMPORARY_AUTH_ERROR =
  "Sign-in is temporarily unavailable. Please try again or contact support.";

const INVALID_CREDENTIALS_ERROR = "Email or password is incorrect.";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {return error.message;}
  if (typeof error === "string") {return error;}
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message ?? "");
  }
  return "";
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code ?? "");
  }
  return "";
}

export function getCustomerSafeAuthError(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error).toLowerCase();

  // Supabase GoTrue returns "Invalid login credentials" + code invalid_credentials.
  // Match both the full phrase and the older/shorter fragments used in tests.
  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    message.includes("invalid email") ||
    message.includes("user_invalid_credentials") ||
    code === "invalid_credentials" ||
    code === "user_invalid_credentials"
  ) {
    return INVALID_CREDENTIALS_ERROR;
  }

  return TEMPORARY_AUTH_ERROR;
}
