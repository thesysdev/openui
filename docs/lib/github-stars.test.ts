import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readGitHubStarCount } from "./github-stars";

describe("readGitHubStarCount", () => {
  it("reads a valid GitHub repository response", () => {
    assert.equal(readGitHubStarCount({ stargazers_count: 9860 }), 9860);
  });

  it("rejects missing, negative, and non-numeric counts", () => {
    assert.equal(readGitHubStarCount({}), null);
    assert.equal(readGitHubStarCount({ stargazers_count: -1 }), null);
    assert.equal(readGitHubStarCount({ stargazers_count: "9860" }), null);
  });
});
