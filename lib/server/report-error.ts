import "server-only";
import { captureException, flush } from "@sentry/nextjs";

export async function reportServerError(operation: string, error: unknown) {
  // Provider errors may contain SQL parameters or request details.
  const category = error instanceof Error ? error.name : "Error";
  const providerStatus = error instanceof Error && /^X API request failed \(HTTP \d{3}\)$/.test(error.message)
    ? ` (${error.message})`
    : "";
  const message = `${operation}: ${category}${providerStatus}`;
  console.error(message);
  if (process.env.SENTRY_DSN) {
    captureException(new Error(message));
    await flush(2_000);
  }
}
