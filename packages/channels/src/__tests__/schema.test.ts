// Schema conformance for every golden scenario: each surface's rendered
// payloads are validated against external authorities (Slack community JSON
// Schema; Telegram's machine-readable Bot API spec) plus documented-limit
// checks. Catches platform-invalid payloads offline, without accounts.
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { buildScenarios } from "./fixtures/scenarios";
import {
  validateSlack,
  validateSlackModal,
  validateTeams,
  validateTelegram,
  validateWhatsApp,
} from "./schemas/validators";

const scenarios = await buildScenarios();

describe("golden scenarios conform to platform schemas", () => {
  for (const [key, value] of Object.entries<any>(scenarios)) {
    test(key, () => {
      if (key.startsWith("modal:")) {
        assert.deepEqual(validateSlackModal(value), []);
      } else if (key.includes("teams")) {
        assert.deepEqual(validateTeams(value.output), []);
      } else if (key.includes("wa")) {
        assert.deepEqual(validateWhatsApp(value.output ?? value.blocks), []);
      } else if (key.includes("tg")) {
        assert.deepEqual(validateTelegram(value.output), []);
      } else {
        assert.deepEqual(validateSlack(value.output ?? value.blocks), []);
      }
    });
  }
});
