import { describe, expect, it } from "vitest";
import { createArtifacts } from ".";
import { caught, fakeFetch, json } from "../__tests__/fake-fetch";
import { createCloudApi } from "../core/http";

const row = {
  id: "art_1",
  kind: "dashboard",
  name: "Sales",
  content: 'root = Card("a")',
  version: "v2",
  pinned: true,
  is_owner: true,
  is_editable: true,
  shares: [{ type: "group", id: "g1", access: "view", created_by: "u1", created_at: 3 }],
  conversation_id: "c1",
  user_id: "u1",
  app_id: "app_1",
  created_at: 1,
  updated_at: 2,
};

/** Artifacts on a fake OpenUI Cloud that answers every call with `reply`. */
function setup(reply: unknown = row, appId?: string) {
  const { fetch, requests } = fakeFetch(() => json(reply));
  const api = createCloudApi({ apiKey: "k", baseUrl: "https://cloud.test", fetch, appId });
  return { artifacts: createArtifacts(api), requests };
}

describe("artifacts", () => {
  it("maps a row to camelCase with times in milliseconds", async () => {
    const { artifacts } = setup();
    expect(await artifacts.get("art_1")).toEqual({
      id: "art_1",
      kind: "dashboard",
      name: "Sales",
      content: 'root = Card("a")',
      version: "v2",
      pinned: true,
      isOwner: true,
      isEditable: true,
      shares: [{ type: "group", id: "g1", access: "view", createdBy: "u1", createdAt: 3000 }],
      conversationId: "c1",
      userId: "u1",
      appId: "app_1",
      createdAt: 1000,
      updatedAt: 2000,
    });
  });

  it("lists with its filters, as the user in the client's app", async () => {
    const { artifacts, requests } = setup(
      { data: [row], has_more: true, last_id: "art_1" },
      "app_1",
    );
    const page = await artifacts.list({
      userId: "u1",
      groupIds: ["g1"],
      kind: ["dashboard", "slides"],
      pinned: false,
      isOwner: true,
      limit: 5,
      order: "asc",
    });
    expect(requests[0]!.url.pathname).toBe("/v1/artifacts");
    expect([...requests[0]!.url.searchParams]).toEqual([
      ["user_id", "u1"],
      ["group_ids", "g1"],
      ["app_id", "app_1"],
      ["kind", "dashboard"],
      ["kind", "slides"],
      ["pinned", "false"],
      ["is_owner", "true"],
      ["limit", "5"],
      ["order", "asc"],
    ]);
    expect(page).toMatchObject({ hasMore: true, lastId: "art_1", data: [{ id: "art_1" }] });
  });

  it("acts as the org without a userId", async () => {
    const { artifacts, requests } = setup(row, "app_1");
    await artifacts.get("art 1");
    expect(requests[0]!.url.pathname).toBe("/v1/artifacts/art%201");
    expect(requests[0]!.url.search).toBe("");
  });

  it("updates, deletes, shares and unshares by id", async () => {
    const { artifacts, requests } = setup();
    await artifacts.update("art_1", { name: "New" }, { userId: "u1" });
    await artifacts.delete("art_1");
    await artifacts.share("art_1", { type: "user", id: "u2", access: "edit" });
    await artifacts.unshare("art_1", { type: "user", id: "u2" });
    expect(requests.map(({ method, url, body }) => [method, url.pathname, body])).toEqual([
      ["POST", "/v1/artifacts/art_1", { name: "New" }],
      ["DELETE", "/v1/artifacts/art_1", undefined],
      ["POST", "/v1/artifacts/art_1/share", { type: "user", id: "u2", access: "edit" }],
      ["POST", "/v1/artifacts/art_1/unshare", { type: "user", id: "u2" }],
    ]);
  });

  it("pins as the user", async () => {
    const { artifacts, requests } = setup();
    await artifacts.pin("art_1", { userId: "u1" });
    await artifacts.unpin("art_1", { userId: "u1" });
    expect(requests.map(({ url }) => url.pathname + url.search)).toEqual([
      "/v1/artifacts/art_1/pin?user_id=u1",
      "/v1/artifacts/art_1/unpin?user_id=u1",
    ]);
  });

  it.each([
    [
      "pin without a user",
      (a: ReturnType<typeof createArtifacts>) => a.pin("art_1", {} as never),
      "userId is required: each user pins their own",
    ],
    [
      "a share with bad access",
      (a: ReturnType<typeof createArtifacts>) =>
        a.share("art_1", { type: "user", id: "u2", access: "own" } as never),
      'access must be "view" or "edit"',
    ],
    [
      "a share to a bad target",
      (a: ReturnType<typeof createArtifacts>) =>
        a.share("art_1", { type: "team", id: "t1", access: "view" } as never),
      'A share target is { type: "user" | "group", id }',
    ],
  ])("rejects %s before any request", async (_, call, message) => {
    const { artifacts, requests } = setup();
    expect(await caught(() => call(artifacts))).toMatchObject({ code: "invalid_input", message });
    expect(requests).toHaveLength(0);
  });

  it("rejects a row without an id", async () => {
    const { artifacts } = setup({ kind: "dashboard" });
    expect(await caught(() => artifacts.get("art_1"))).toMatchObject({
      code: "invalid_response",
      status: 502,
    });
  });
});
