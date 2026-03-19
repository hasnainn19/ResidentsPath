type ModelOperationResult = {
  errors?: unknown[] | undefined;
};

/**
 * Logs AppSync model operation errors to console.error in a safe, truncated format.
 * No-ops if errors is empty or undefined.
 *
 * @param prefix - Optional label prepended to the log output to identify the operation
 * @param errors - The errors array from an AppSync model operation result
 */
export function logModelErrors(prefix: string | undefined, errors: unknown[] | undefined) {
  if (!Array.isArray(errors) || errors.length === 0) return;

  const safe = errors.map((error) => {
    const item = error as { message?: unknown; errorType?: unknown };

    return {
      message: typeof item.message === "string" ? item.message.slice(0, 200) : "unknown",
      errorType: typeof item.errorType === "string" ? item.errorType : undefined,
    };
  });
  if (prefix) {
    console.error(prefix, safe);
  } 
  else {
    console.error(safe);
  }
}

/**
 * Awaits an AppSync model operation, logs any returned errors, and returns the data.
 * Does not throw - errors are logged and null is returned if data is absent.
 *
 * @param result - The Promise returned directly from an AppSync model operation
 * @param errorLogPrefix - Optional label prepended to the error log output to identify the operation
 * @returns The data from the result, or null if absent
 */
export async function callModel<T>(
  result: Promise<{ data: T; errors?: unknown[] | undefined }>,
  errorLogPrefix?: string,
): Promise<T | null> {
  const { data, errors } = await result;
  if (errors?.length) {
    logModelErrors(errorLogPrefix, errors);
  }
  return data ?? null;
}

/**
 * Runs a critical AppSync model operation and throws if it returns errors.
 * Use for operations where failure should halt execution.
 *
 * @param failureLogPrefix - Label prepended to the error log output
 * @param failureMessage - Message for the thrown Error if the operation fails
 * @param fn - Factory function returning the AppSync model operation Promise
 * @returns The full result object if successful
 * @throws Error with failureMessage if the operation returns errors
 */
export async function runCleanup<T extends ModelOperationResult>(
  failureLogPrefix: string,
  failureMessage: string,
  fn: () => Promise<T>,
) {
  const result = await fn();

  if (result.errors?.length) {
    logModelErrors(failureLogPrefix, result.errors);
    throw new Error(failureMessage);
  }

  return result;
}

/**
 * Runs a non-critical async operation and swallows any thrown errors, logging a warning instead.
 * Use for cleanup operations where failure should not halt execution.
 *
 * @param logPrefix - Label prepended to the warning log output
 * @param fn - Factory function returning the async operation Promise
 * @returns true if the operation succeeded, false if it threw
 */
export async function tryCleanup(logPrefix: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(logPrefix, msg);
    return false;
  }
}
