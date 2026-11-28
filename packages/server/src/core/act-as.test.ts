import { describe, expect, it } from "vitest";
import { caught } from "../__tests__/fake-fetch";
import { actAs, actAsFields, callAs } from "./act-as";
import type { CloudApi } from "./http";

const api = (appId?: string) => ({ ...(appId !== undefined && { appId }) }) as CloudApi;

describe("actAs", () => {
  it("is the org without a user: no user, group or app fields", () => {
    expect(actAs(api("app_1"))).toEqual({});
  });

  it("names the user, their groups and the client's app", () => {
    expect(actAs(api("app_1"), { userId: "u1", groupIds: ["g1", "g2"] })).toEqual({
      user_id: "u1",
      group_ids: ["g1", "g2"],
      app_id: "app_1",
    });
  });

  it("leaves out empty groups and a missing app", () => {
    expect(actAs(api(), { userId: "u1", groupIds: [] })).toEqual({ user_id: "u1" });
  });

  it.each([
    [{ groupIds: ["g1"] }, "groupIds needs userId: they're that user's groups"],
    [{ userId: " " }, "userId must be a non-empty string: take it from your authenticated session"],
    [{ userId: "u1", groupIds: ["g1", ""] }, "groupIds must be an array of non-empty strings"],
  ])("rejects %j", async (options, message) => {
    expect(await caught(() => actAs(api(), options))).toMatchObject({
      name: "OpenUIApiError",
      code: "invalid_input",
      message,
    });
  });
});

describe("actAsFields", () => {
  it("builds the fields without checking them", () => {
    expect(actAsFields(api("app_1"), { userId: "", groupIds: ["g1"] })).toEqual({
      user_id: "",
      group_ids: ["g1"],
      app_id: "app_1",
    });
  });
});

describe("callAs", () => {
  it("passes the signal along with the query", () => {
    const signal = new AbortController().signal;
    expect(callAs(api(), { userId: "u1", signal })).toEqual({
      query: { user_id: "u1" },
      signal,
    });
  });
});
