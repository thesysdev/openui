import assert from "node:assert/strict";
import { test } from "node:test";
import { externalHasResponded, FLAG_LABEL, flagReason, WAITING_LABEL } from "./triage.mjs";

const NOW = Date.parse("2026-06-15T00:00:00Z");
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();
const member = { login: "maintainer", type: "User" };
const outsider = { login: "someone", type: "User" };
const devin = { login: "devin-ai-integration[bot]", type: "Bot" };
const vercel = { login: "vercel[bot]", type: "Bot" };

const issue = (over = {}) => ({
  number: 1,
  created_at: daysAgo(3),
  author_association: "NONE",
  user: outsider,
  labels: [],
  assignees: [],
  ...over,
});
const pr = (over = {}) => issue({ pull_request: {}, ...over });
const comment = (user, association, days) => ({ user, association, createdAt: daysAgo(days) });

test("external issue without a priority is flagged", () => {
  assert.ok(flagReason(issue(), [], NOW));
});

test("external issue with a priority and a team reply is not flagged", () => {
  const item = issue({ labels: ["P2"] });
  assert.equal(flagReason(item, [comment(member, "MEMBER", 1)], NOW), null);
});

test("external issue with a priority but the last word from outside is flagged", () => {
  const item = issue({ labels: ["P2"] });
  assert.ok(flagReason(item, [comment(member, "MEMBER", 2), comment(outsider, "NONE", 1)], NOW));
});

test("team issue is not flagged", () => {
  assert.equal(flagReason(issue({ author_association: "MEMBER", user: member }), [], NOW), null);
});

test("unassigned P0/P1 is flagged, assigned P1 is not until stale", () => {
  const team = { author_association: "MEMBER", user: member };
  assert.ok(flagReason(issue({ ...team, labels: ["P1"] }), [], NOW));
  const assigned = { ...team, labels: ["P1"], assignees: [member] };
  assert.equal(flagReason(issue(assigned), [], NOW), null);
  assert.ok(flagReason(issue({ ...assigned, created_at: daysAgo(31) }), [], NOW));
});

test("assigned P0 goes stale after a day", () => {
  const item = issue({ labels: ["P0"], assignees: [member], created_at: daysAgo(2) });
  assert.ok(flagReason(item, [], NOW));
});

test("waiting label pauses triage", () => {
  assert.equal(flagReason(issue({ labels: [WAITING_LABEL] }), [], NOW), null);
});

test("assigned-for-triage needs an assignee and expires after 14 days", () => {
  const labels = ["status: assigned-for-triage"];
  assert.ok(flagReason(issue({ labels }), [], NOW, daysAgo(1)));
  const assigned = issue({ labels, assignees: [member] });
  assert.equal(flagReason(assigned, [], NOW, daysAgo(1)), null);
  assert.ok(flagReason(assigned, [], NOW, daysAgo(15)));
});

test("external PR is flagged until a maintainer responds", () => {
  assert.ok(flagReason(pr(), [], NOW));
  assert.equal(flagReason(pr(), [comment(member, "MEMBER", 1)], NOW), null);
  assert.ok(flagReason(pr(), [comment(member, "MEMBER", 2), comment(outsider, "NONE", 1)], NOW));
});

test("other bots don't count as a reply, team bots do", () => {
  assert.ok(flagReason(pr(), [comment(vercel, "NONE", 1)], NOW));
  assert.equal(flagReason(pr(), [comment(devin, "CONTRIBUTOR", 1)], NOW), null);
});

test("PRs from team members and team bots are not flagged", () => {
  assert.equal(flagReason(pr({ author_association: "MEMBER", user: member }), [], NOW), null);
  assert.equal(flagReason(pr({ author_association: "CONTRIBUTOR", user: devin }), [], NOW), null);
});

test("waiting label clears only on an external human reply after it was added", () => {
  const since = daysAgo(2);
  assert.equal(externalHasResponded([comment(outsider, "NONE", 3)], since), false);
  assert.equal(externalHasResponded([comment(member, "MEMBER", 1)], since), false);
  assert.equal(externalHasResponded([comment(vercel, "NONE", 1)], since), false);
  assert.equal(externalHasResponded([comment(outsider, "NONE", 1)], since), true);
});

test("flag label name", () => {
  assert.equal(FLAG_LABEL, "status: needs-triage");
});
