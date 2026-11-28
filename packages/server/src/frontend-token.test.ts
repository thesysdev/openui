import { describe, expect, it } from "vitest";
import { caught, fakeFetch, json } from "./__tests__/fake-fetch";
import { createCloudApi } from "./core/http";
import { createFrontendToken } from "./frontend-token";

function setup(reply: unknown = { token: "fct_1", expires_at: 9 }, appId?: string) {
  const { fetch, requests } = fakeFetch(() => json(reply));
  return { api: createCloudApi({ apiKey: "k", fetch, appId }), requests };
}

describe("createFrontendToken", () => {
  it("mints a token for the user, their groups and the client's app", async () => {
    const { api, requests } = setup(undefined, "app_1");
    const token = await createFrontendToken(api, { userId: "u1", groupIds: ["g1"] });
    expect(token).toEqual({ token: "fct_1", expires_at: 9 });
    expect(requests[0]).toMatchObject({
      method: "POST",
      body: { user_id: "u1", group_ids: ["g1"], app_id: "app_1" },
    });
    expect(requests[0]!.url.pathname).toBe("/v1/frontend-tokens");
  });

  it("leaves out empty groups and a missing app", async () => {
    const { api, requests } = setup();
    await createFrontendToken(api, { userId: "u1", groupIds: [] });
    expect(requests[0]!.body).toEqual({ user_id: "u1" });
  });

  it.each([
    [{ userId: " " }, "userId is required: take it from your authenticated session"],
    [{ userId: "u1", groupIds: [""] }, "groupIds must be an array of non-empty strings"],
  ])("rejects %j before any request", async (params, message) => {
    const { api, requests } = setup();
    expect(await caught(() => createFrontendToken(api, params))).toMatchObject({
      code: "invalid_input",
      message,
    });
    expect(requests).toHaveLength(0);
  });

  it("rejects a reply without a token", async () => {
    const { api } = setup({ token: "", expires_at: 9 });
    expect(await caught(() => createFrontendToken(api, { userId: "u1" }))).toMatchObject({
      code: "invalid_response",
      status: 502,
    });
  });
});
