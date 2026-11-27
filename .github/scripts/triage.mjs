// Keeps `status: needs-triage` on the open issues and PRs that need a
// maintainer, and clears `status: waiting-for-author-response` once the author
// replies. The rules are in CONTRIBUTING.md ("Labels and triage") and in
// flagReason() below.
//
// Event runs check only the item the event is about. Scheduled and manual runs
// check every open item, which also catches the time-based rules.

import { ensureLabels, LABELS } from "./labels.mjs";

export const FLAG_LABEL = "status: needs-triage";
export const WAITING_LABEL = "status: waiting-for-author-response";
export const ASSIGNED_FOR_TRIAGE_LABEL = "status: assigned-for-triage";
export const PRIORITY_LABELS = ["P0", "P1", "P2", "P3"];

// An item labeled `status: assigned-for-triage` is flagged again after this.
export const TRIAGE_ASSIGNMENT_DAYS = 14;
// Priorities that need an assignee.
export const ASSIGNEE_REQUIRED_PRIORITIES = new Set(["P0", "P1"]);
// Days without human activity before an assigned issue is flagged.
export const STALE_DAYS = { P0: 1, P1: 30 };

const MAINTAINER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
// Bots that open PRs and comment on behalf of the team.
export const TEAM_BOTS = new Set(["devin-ai-integration[bot]", "thesys-pr-creator[bot]"]);

const DAY_MS = 24 * 60 * 60 * 1000;

export const isBot = (user) =>
  Boolean(user) && (user.type === "Bot" || /\[bot\]$/.test(user.login || ""));

// Anyone outside the team is external, including bots other than TEAM_BOTS.
export const isExternal = ({ association, user }) =>
  !MAINTAINER_ASSOCIATIONS.has(association) && !TEAM_BOTS.has(user?.login);

// Other bots (CI, previews) don't count as activity or as a reply.
const countsAsHuman = (user) => !isBot(user) || TEAM_BOTS.has(user.login);

const labelNames = (item) => (item.labels || []).map((l) => (typeof l === "string" ? l : l.name));

const ageInDays = (iso, now) => (now - new Date(iso).getTime()) / DAY_MS;

// The latest comment or review by a person (or team bot), else the opening post.
export function lastHumanContribution(item, contributions) {
  let latest = {
    createdAt: item.created_at,
    association: item.author_association,
    user: item.user,
  };
  for (const c of contributions) {
    if (countsAsHuman(c.user) && c.createdAt >= latest.createdAt) latest = c;
  }
  return latest;
}

// True when someone outside the team replied after the waiting label went on.
export function externalHasResponded(contributions, waitingSince) {
  if (!waitingSince) return false;
  return contributions.some((c) => c.createdAt >= waitingSince && isExternal(c) && !isBot(c.user));
}

// Why the item needs triage, or null if it doesn't.
export function flagReason(item, contributions, now, assignedForTriageSince = null) {
  const labels = labelNames(item);
  const assignees = item.assignees?.length ?? 0;

  if (labels.includes(WAITING_LABEL)) return null;

  if (labels.includes(ASSIGNED_FOR_TRIAGE_LABEL)) {
    if (assignees === 0) return `'${ASSIGNED_FOR_TRIAGE_LABEL}' is set but nobody is assigned`;
    if (assignedForTriageSince && ageInDays(assignedForTriageSince, now) > TRIAGE_ASSIGNMENT_DAYS) {
      return `'${ASSIGNED_FOR_TRIAGE_LABEL}' was added over ${TRIAGE_ASSIGNMENT_DAYS} days ago`;
    }
    return null;
  }

  const latest = lastHumanContribution(item, contributions);
  const openedByExternal = isExternal({ association: item.author_association, user: item.user });

  if (item.pull_request) {
    if (!openedByExternal) return null;
    return isExternal(latest) ? "no maintainer has responded to the author" : null;
  }

  const priority = PRIORITY_LABELS.find((p) => labels.includes(p));
  const needsPriority = !priority && (openedByExternal || contributions.some(isExternal));
  const noPriority = "external input but no priority label";

  if (assignees > 0) {
    const days = STALE_DAYS[priority];
    if (days !== undefined && ageInDays(latest.createdAt, now) > days) {
      return `${priority} with no human activity for over ${days} day${days === 1 ? "" : "s"}`;
    }
    return needsPriority ? noPriority : null;
  }
  if (ASSIGNEE_REQUIRED_PRIORITIES.has(priority)) return `${priority} with no assignee`;
  if (needsPriority) return noPriority;
  if (isExternal(latest)) return "latest comment is from an external contributor, unanswered";
  return null;
}

const toEvent = (c) => ({
  createdAt: c.created_at || c.submitted_at,
  association: c.author_association,
  user: c.user,
});

async function fetchContributions({ github, owner, repo }, item) {
  const all = (endpoint, params) =>
    github.paginate(endpoint, { owner, repo, per_page: 100, ...params });
  const isPr = Boolean(item.pull_request);
  const [comments, reviews, reviewComments] = await Promise.all([
    item.comments ? all(github.rest.issues.listComments, { issue_number: item.number }) : [],
    isPr ? all(github.rest.pulls.listReviews, { pull_number: item.number }) : [],
    isPr ? all(github.rest.pulls.listReviewComments, { pull_number: item.number }) : [],
  ]);
  return [...comments, ...reviews, ...reviewComments].map(toEvent);
}

// When each of `names` was last added to the item.
async function labelsAddedAt({ github, owner, repo }, item, names) {
  const addedAt = {};
  const events = await github.paginate(github.rest.issues.listEvents, {
    owner,
    repo,
    issue_number: item.number,
    per_page: 100,
  });
  for (const e of events) {
    const name = e.label?.name;
    if (e.event === "labeled" && names.includes(name) && !(addedAt[name] > e.created_at)) {
      addedAt[name] = e.created_at;
    }
  }
  return addedAt;
}

async function reconcile(client, number, now, core) {
  const { github, owner, repo } = client;
  const target = { owner, repo, issue_number: number };
  const { data: item } = await github.rest.issues.get(target);
  if (item.state !== "open") return;

  let labels = labelNames(item);
  const timed = [WAITING_LABEL, ASSIGNED_FOR_TRIAGE_LABEL].filter((l) => labels.includes(l));
  const [contributions, addedAt] = await Promise.all([
    fetchContributions(client, item),
    timed.length ? labelsAddedAt(client, item, timed) : {},
  ]);

  if (
    labels.includes(WAITING_LABEL) &&
    externalHasResponded(contributions, addedAt[WAITING_LABEL])
  ) {
    await github.rest.issues.removeLabel({ ...target, name: WAITING_LABEL });
    labels = labels.filter((l) => l !== WAITING_LABEL);
    core.info(`#${number}: removed '${WAITING_LABEL}', the author replied`);
  }

  const reason = flagReason(
    { ...item, labels },
    contributions,
    now,
    addedAt[ASSIGNED_FOR_TRIAGE_LABEL] ?? null,
  );
  const flagged = labels.includes(FLAG_LABEL);
  if (reason && !flagged) {
    await ensureLabels(client, [FLAG_LABEL]);
    await github.rest.issues.addLabels({ ...target, labels: [FLAG_LABEL] });
    core.info(`#${number}: flagged, ${reason}`);
  } else if (!reason && flagged) {
    await github.rest.issues.removeLabel({ ...target, name: FLAG_LABEL });
    core.info(`#${number}: unflagged`);
  }
}

export default async function triage({ github, context, core }) {
  const { owner, repo } = context.repo;
  const client = { github, owner, repo };
  const now = Date.now();

  const single = context.payload.issue?.number ?? context.payload.pull_request?.number;
  let numbers;
  if (single) {
    numbers = [single];
  } else {
    await ensureLabels(
      client,
      Object.keys(LABELS).filter((l) => l.startsWith("status: ") || PRIORITY_LABELS.includes(l)),
    );
    const open = await github.paginate(github.rest.issues.listForRepo, {
      owner,
      repo,
      state: "open",
      per_page: 100,
    });
    numbers = open.map((i) => i.number);
  }

  let failed = 0;
  for (const number of numbers) {
    try {
      await reconcile(client, number, now, core);
    } catch (err) {
      failed += 1;
      core.warning(`#${number}: ${err.message}`);
    }
  }
  core.info(`Checked ${numbers.length} item(s), ${failed} failed`);
}
