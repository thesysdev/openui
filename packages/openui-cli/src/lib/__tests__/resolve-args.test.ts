import { beforeEach, describe, expect, it, vi } from "vitest";

import { CliCancelledError, CreateError } from "../errors";
import { resolveArgs } from "../resolve-args";

const inputMock = vi.fn();
const selectMock = vi.fn();

// The prompt libraries are imported dynamically inside resolveArgs, so we stub
// them here to keep the tests deterministic and free of real interactive input.
vi.mock("@inquirer/prompts", () => ({
  input: (...args: unknown[]) => inputMock(...args),
  select: (...args: unknown[]) => selectMock(...args),
}));

class FakeExitPromptError extends Error {}

vi.mock("@inquirer/core", () => ({
  ExitPromptError: FakeExitPromptError,
}));

describe("resolveArgs", () => {
  beforeEach(() => {
    inputMock.mockReset();
    selectMock.mockReset();
  });

  it("returns provided values without prompting (interactive)", async () => {
    const result = await resolveArgs(
      {
        name: { value: "my-app" },
        count: { value: 3 },
      },
      true,
    );

    expect(result).toEqual({ name: "my-app", count: 3 });
    expect(inputMock).not.toHaveBeenCalled();
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("returns provided values without prompting (non-interactive)", async () => {
    const result = await resolveArgs({ name: { value: "my-app" } }, false);

    expect(result).toEqual({ name: "my-app" });
    expect(inputMock).not.toHaveBeenCalled();
  });

  it("throws an invalid-input CreateError on a missing required arg when non-interactive", async () => {
    const error = await resolveArgs(
      {
        entry: {
          prompt: { type: "input", message: "Entry file path?" },
          required: true,
        },
      },
      false,
    ).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(CreateError);
    expect(error).toMatchObject({
      message: "Missing required argument --entry",
      stage: "args_resolution",
      errorClass: "invalid_input",
      errorCode: "MISSING_REQUIRED_ARG",
    });
    expect(inputMock).not.toHaveBeenCalled();
  });

  it("prompts for missing required args when interactive (input)", async () => {
    inputMock.mockResolvedValue("from-input");

    const result = await resolveArgs(
      {
        entry: {
          prompt: { type: "input", message: "Entry file path?", default: "index.ts" },
          required: true,
        },
      },
      true,
    );

    expect(result).toEqual({ entry: "from-input" });
    expect(inputMock).toHaveBeenCalledWith({
      message: "Entry file path?",
      default: "index.ts",
    });
  });

  it("prompts using select, showing every choice, for select-type configs", async () => {
    selectMock.mockResolvedValue("react");

    const result = await resolveArgs(
      {
        framework: {
          prompt: {
            type: "select",
            message: "Pick a framework",
            choices: [{ value: "react" }, { value: "vue" }],
          },
          required: true,
        },
      },
      true,
    );

    expect(result).toEqual({ framework: "react" });
    expect(selectMock).toHaveBeenCalledWith({
      message: "Pick a framework",
      choices: [{ value: "react" }, { value: "vue" }],
      pageSize: 2,
    });
  });

  it("mixes provided values with prompted ones, preserving keys", async () => {
    inputMock.mockResolvedValue("prompted");

    const result = await resolveArgs(
      {
        name: { value: "given" },
        entry: {
          prompt: { type: "input", message: "Entry?" },
          required: true,
        },
      },
      true,
    );

    expect(result).toEqual({ name: "given", entry: "prompted" });
    expect(inputMock).toHaveBeenCalledTimes(1);
  });

  it("throws a clean cancellation (exit code 0) naming the open prompt when the user cancels", async () => {
    inputMock.mockRejectedValue(new FakeExitPromptError("cancelled"));

    const error = await resolveArgs(
      {
        entry: {
          prompt: { type: "input", message: "Entry?" },
          required: true,
        },
      },
      true,
    ).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(CliCancelledError);
    expect(error).toMatchObject({
      exitCode: 0,
      errorClass: "user_cancelled",
      errorCode: "USER_CANCELLED",
      errorMetadata: { step_name: "entry" },
    });
  });

  it("rethrows non-cancellation errors from a prompt", async () => {
    const boom = new Error("unexpected");
    inputMock.mockRejectedValue(boom);

    await expect(
      resolveArgs(
        {
          entry: {
            prompt: { type: "input", message: "Entry?" },
            required: true,
          },
        },
        true,
      ),
    ).rejects.toBe(boom);
  });
});
