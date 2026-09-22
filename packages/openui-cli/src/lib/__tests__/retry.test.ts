import { describe, expect, it, vi } from "vitest";

import { CreateError } from "../errors";
import { isNetworkError, withRetry } from "../retry";

describe("withRetry", () => {
  it("resolves on the first attempt without sleeping", async () => {
    const sleep = vi.fn(async () => {});
    const fn = vi.fn(async () => "ok");

    await expect(
      withRetry(fn, { shouldRetry: isNetworkError, sleep, label: "request" }),
    ).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledWith(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries network errors with exponential backoff", async () => {
    const error = new CreateError("source_checkout", "offline", "network", "NETWORK_FAILED");
    const sleep = vi.fn(async () => {});
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue("ok");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      withRetry(fn, { shouldRetry: isNetworkError, sleep, label: "source checkout" }),
    ).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 1000);
    expect(sleep).toHaveBeenNthCalledWith(2, 2000);
    vi.restoreAllMocks();
  });

  it("records attempts when network retries are exhausted", async () => {
    const error = new CreateError("source_checkout", "offline", "network", "NETWORK_FAILED");
    const sleep = vi.fn(async () => {});
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValue(error);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      withRetry(fn, {
        shouldRetry: isNetworkError,
        sleep,
        onRetry,
        label: "source checkout",
      }),
    ).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(error.errorMetadata.attempts).toBe(3);
    expect(onRetry.mock.calls.map(([info]) => info.attempt)).toEqual([1, 2]);
    vi.restoreAllMocks();
  });

  it.each([
    new CreateError("source_checkout", "git missing", "process", "GIT_MISSING"),
    new CreateError("source_checkout", "permission denied", "filesystem", "PERMISSION_DENIED"),
    new Error("plain"),
  ])("does not retry %s", async (error) => {
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, { shouldRetry: isNetworkError, sleep: async () => {}, label: "request" }),
    ).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
    if (error instanceof CreateError) expect(error.errorMetadata.attempts).toBe(1);
  });
});

describe("isNetworkError", () => {
  it("only matches network CreateError instances", () => {
    expect(isNetworkError(new CreateError("stage", "network", "network", "NETWORK_FAILED"))).toBe(
      true,
    );
    expect(isNetworkError(new CreateError("stage", "process", "process", "GIT_MISSING"))).toBe(
      false,
    );
    expect(
      isNetworkError(new CreateError("stage", "filesystem", "filesystem", "PERMISSION_DENIED")),
    ).toBe(false);
    expect(isNetworkError(new Error("network"))).toBe(false);
  });
});
