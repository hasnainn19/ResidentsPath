type ModelOperationResult = {
  errors?: unknown[] | undefined;
};

// Log errors from model operations
export function logModelErrors(prefix: string, errors: unknown[] | undefined) {
  if (!Array.isArray(errors) || errors.length === 0) return;

  const safe = errors.map((error) => {
    const item = error as { message?: unknown; errorType?: unknown };

    return {
      message: typeof item.message === "string" ? item.message.slice(0, 200) : "unknown",
      errorType: typeof item.errorType === "string" ? item.errorType : undefined,
    };
  });
  console.error(prefix, safe);
}

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
