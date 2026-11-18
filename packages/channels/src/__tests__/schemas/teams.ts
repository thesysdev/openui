/**
 * Teams payload validation, three layers deep:
 *   1. Microsoft's official Adaptive Card JSON Schema 1.5 (vendored from
 *      adaptivecards.io - the version Teams bots support), via ajv
 *   2. Microsoft's official `adaptivecards` parser - the same implementation
 *      real clients run - whose parse diagnostics catch what the schema misses
 *   3. Teams-specific rules the format itself doesn't know: card size cap,
 *      visible-action limits, version pin
 */
import ACdefault, * as ACns from "adaptivecards";
import type { ValidateFunction } from "ajv";
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const AC: any = (ACdefault as any)?.AdaptiveCard ? ACdefault : ACns;

const schema = JSON.parse(
  readFileSync(new URL("./adaptive-card-1.5.schema.json", import.meta.url), "utf8"),
);
// The official schema declares a draft-04-style root `id`, which ajv rejects.
delete schema.id;

let compiled: ValidateFunction | null = null;
function schemaValidator(): ValidateFunction {
  if (!compiled) {
    const ajv = new Ajv({ strict: false, allowUnionTypes: true });
    // The official schema declares draft-06.
    ajv.addMetaSchema(
      JSON.parse(
        readFileSync(
          createRequire(import.meta.url).resolve("ajv/dist/refs/json-schema-draft-06.json"),
          "utf8",
        ),
      ),
    );
    // URL well-formedness is checked by layer 2 (the official parser).
    ajv.addFormat("uri", true);
    ajv.addFormat("uri-reference", true);
    compiled = ajv.compile(schema);
  }
  return compiled;
}

const TEAMS_MAX_CARD_BYTES = 28 * 1024; // Teams' documented card size cap
const TEAMS_MAX_ACTIONS = 6; // visible action limit in Teams

export function validateTeamsCard(card: Record<string, any>): string[] {
  const problems: string[] = [];

  // 1. Official JSON Schema
  const validate = schemaValidator();
  if (!validate(card)) {
    for (const e of validate.errors ?? []) problems.push(`schema${e.instancePath}: ${e.message}`);
  }

  // 2. Official parser diagnostics
  try {
    const ctx = new AC.SerializationContext();
    const parsed = new AC.AdaptiveCard();
    parsed.parse(card, ctx);
    for (let i = 0; i < ctx.eventCount; i++) {
      const e = ctx.getEventAt(i);
      problems.push(`parser (${AC.ValidationEvent[e.event]}): ${e.message}`);
    }
  } catch (e: any) {
    problems.push(`parser threw: ${e?.message ?? e}`);
  }

  // 3. Teams-specific rules
  if (card.version !== "1.5")
    problems.push(`version must be "1.5" for Teams bots (got ${card.version})`);
  const bytes = Buffer.byteLength(JSON.stringify(card), "utf8");
  if (bytes > TEAMS_MAX_CARD_BYTES)
    problems.push(`card is ${bytes} bytes (Teams cap ~${TEAMS_MAX_CARD_BYTES})`);
  const countActions = (node: any): number =>
    !node || typeof node !== "object"
      ? 0
      : (Array.isArray(node) ? node : Object.values(node)).reduce(
          (n: number, v: any) => n + countActions(v),
          node.type === "ActionSet" ? (node.actions?.length ?? 0) : 0,
        );
  const actions = countActions(card.body);
  if (actions > TEAMS_MAX_ACTIONS)
    problems.push(`${actions} actions on the card (Teams shows at most ${TEAMS_MAX_ACTIONS})`);

  return problems;
}
