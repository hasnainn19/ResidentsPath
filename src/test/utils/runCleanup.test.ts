import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    logModelErrors,
    callModel,
    runCleanup,
    tryCleanup,
} from "../../../amplify/functions/utils/runCleanup";

describe("runCleanup utils", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("logModelErrors", () => {
        it("does nothing when errors is undefined", () => {
            logModelErrors("prefix", undefined);
            expect(console.error).not.toHaveBeenCalled();
        });

        it("does nothing when errors is an empty array", () => {
            logModelErrors("prefix", []);
            expect(console.error).not.toHaveBeenCalled();
        });

        it("logs errors with prefix", () => {
            logModelErrors("my prefix", [{ message: "something failed", errorType: "Unauthorized" }]);
            expect(console.error).toHaveBeenCalledWith("my prefix", [
                { message: "something failed", errorType: "Unauthorized" },
            ]);
        });

        it("logs errors without prefix when prefix is undefined", () => {
            logModelErrors(undefined, [{ message: "something failed" }]);
            expect(console.error).toHaveBeenCalledWith([{ message: "something failed", errorType: undefined }]);
        });

        it("truncates messages over 200 characters", () => {
            const longMessage = "a".repeat(250);
            logModelErrors("prefix", [{ message: longMessage }]);
            expect(console.error).toHaveBeenCalledWith("prefix", [
                { message: "a".repeat(200), errorType: undefined },
            ]);
        });

        it("uses 'unknown' for non-string error messages", () => {
            logModelErrors("prefix", [{ message: 12345 }]);
            expect(console.error).toHaveBeenCalledWith("prefix", [
                { message: "unknown", errorType: undefined },
            ]);
        });

        it("omits errorType when it is not a string", () => {
            logModelErrors("prefix", [{ message: "failed", errorType: 999 }]);
            expect(console.error).toHaveBeenCalledWith("prefix", [
                { message: "failed", errorType: undefined },
            ]);
        });
    });

    describe("callModel", () => {
        it("returns data when operation succeeds", async () => {
            const result = await callModel(Promise.resolve({ data: { id: "abc" } }));
            expect(result).toEqual({ id: "abc" });
        });

        it("returns null when data is null", async () => {
            const result = await callModel(Promise.resolve({ data: null }));
            expect(result).toBeNull();
        });

        it("logs to console.error when errors are present", async () => {
            await callModel(
                Promise.resolve({ data: null, errors: [{ message: "failed" }] }),
                "my prefix"
            );
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe("runCleanup", () => {
        it("returns the full result when operation succeeds", async () => {
            const result = await runCleanup(
                "prefix",
                "failure message",
                () => Promise.resolve({ data: { id: "abc" } })
            );
            expect(result).toEqual({ data: { id: "abc" } });
        });

        it("logs errors and throws with failureMessage when operation fails", async () => {
            await expect(
                runCleanup(
                    "my prefix",
                    "something went wrong",
                    () => Promise.resolve({ data: null, errors: [{ message: "db error" }] })
                )
            ).rejects.toThrow("something went wrong");

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe("tryCleanup", () => {
        it("returns true when fn succeeds", async () => {
            const result = await tryCleanup("prefix", () => Promise.resolve());
            expect(result).toBe(true);
        });

        it("returns false and logs warning when fn throws an Error", async () => {
            const result = await tryCleanup("my prefix", () => Promise.reject(new Error("cleanup failed")));
            expect(result).toBe(false);
            expect(console.warn).toHaveBeenCalledWith("my prefix", "cleanup failed");
        });

        it("returns false and logs warning when fn throws a non-Error value", async () => {
            const result = await tryCleanup("my prefix", () => Promise.reject("raw string error"));
            expect(result).toBe(false);
            expect(console.warn).toHaveBeenCalledWith("my prefix", "raw string error");
        });
    });
});
