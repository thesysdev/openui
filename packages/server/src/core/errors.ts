/** Failures from the OpenUI Cloud API expose a stable code and the HTTP status. */
export class OpenUIApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenUIApiError";
  }
}

export function invalidInput(message: string): never {
  throw new OpenUIApiError(message, "invalid_input");
}

export const invalidResponse = () =>
  new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
