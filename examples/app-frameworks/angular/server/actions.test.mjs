import assert from "node:assert/strict";
import { test } from "node:test";
import { formMessage } from "../src/app/openui/actions.ts";

test("form actions include the title and edited values under their field labels", () => {
  assert.equal(
    formMessage(
      "Project estimate",
      [
        { name: "project", label: "Project name" },
        { name: "team", label: "Team size" },
        { name: "notes", label: "Notes" },
      ],
      { project: "Aurora-731", team: "7", notes: "Prioritize accessibility and charts" },
    ),
    "Project estimate\nProject name: Aurora-731\nTeam size: 7\nNotes: Prioritize accessibility and charts",
  );
});
