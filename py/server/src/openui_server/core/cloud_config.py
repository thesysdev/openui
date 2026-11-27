"""OpenUI Cloud's config block: lang-core's `generateSystemPrompt({ cloud: true })`, in Python.

Wire contract with lang-core: `cloud_config` and `validate_chat_library` port
`packages/lang-core/src/parser/cloud-config.ts` and `validate-library.ts`. Change them together."""

from __future__ import annotations

import re
from collections.abc import Mapping
from typing import (
    TYPE_CHECKING,
    Any,
    TypedDict,
)

if TYPE_CHECKING:
    pass
from .http import json_text


class PromptOptions(TypedDict, total=False):
    """Extends the prompt built from your library."""

    examples: list[str]
    preamble: str
    additional_rules: list[str]


CONFIG_MARKER = "]]>openui:config\n"


_REF = re.compile(r"^#/\$defs/(.+)$")


def _collect_ref_issues(node: Any, path: str, defs: set[str], issues: list[str]) -> None:
    """Every `$ref` must resolve within `$defs`."""
    if isinstance(node, list):
        for index, item in enumerate(node):
            _collect_ref_issues(item, f"{path}/{index}", defs, issues)
        return
    if not isinstance(node, Mapping):
        return
    ref = node.get("$ref")
    if isinstance(ref, str):
        match = _REF.match(ref)
        if not match or match.group(1) not in defs:
            issues.append(
                f'Unresolvable $ref "{ref}" at {path} — refs must be "#/$defs/<name>" pointing at'
                " a component in $defs."
            )
    for key, value in node.items():
        if key != "$ref":
            _collect_ref_issues(value, f"{path}/{key}", defs, issues)


def validate_chat_library(library: Any) -> list[str]:
    """Structural problems with your library, all at once (empty = valid)."""
    if not isinstance(library, Mapping):
        return ["chatLibrary must be an object."]
    issues: list[str] = []
    root, schema = library.get("root"), library.get("schema")
    if root is not None and (not isinstance(root, str) or not root):
        issues.append("chatLibrary.root, when present, must be a non-empty string.")
    if not isinstance(schema, Mapping):
        issues.append("chatLibrary.schema must be an object with a $defs map of component schemas.")
        return issues
    defs = schema.get("$defs")
    if not isinstance(defs, Mapping) or not defs:
        issues.append(
            "chatLibrary.schema.$defs must be a non-empty object keyed by component name."
        )
        return issues

    names = set(defs)
    if isinstance(root, str) and root and root not in names:
        issues.append(
            f'Root component "{root}" was not found in schema.$defs. Available components:'
            f" {', '.join(defs)}."
        )
    for name, definition in defs.items():
        path = f"$defs/{name}"
        if not isinstance(definition, Mapping):
            issues.append(f"{path} must be an object component schema.")
            continue
        properties = definition.get("properties")
        if properties is not None and not isinstance(properties, Mapping):
            issues.append(f"{path}/properties must be an object.")
        required = definition.get("required")
        if required is not None:
            if not isinstance(required, list) or any(not isinstance(r, str) for r in required):
                issues.append(f"{path}/required must be an array of property names.")
            else:
                keys = set(properties) if isinstance(properties, Mapping) else set()
                issues += [
                    f'{path} lists required property "{r}" that is not in properties.'
                    for r in required
                    if r not in keys
                ]
        _collect_ref_issues(properties, f"{path}/properties", names, issues)

    for group in library.get("componentGroups") or []:
        if (
            not isinstance(group, Mapping)
            or not isinstance(group.get("name"), str)
            or not isinstance(group.get("components"), list)
        ):
            issues.append(
                "Each componentGroups entry must be"
                " {name: string, components: string[], notes?: string[]}."
            )
            continue
        issues += [
            f'Component group "{group["name"]}" references unknown component "{component}".'
            for component in group["components"]
            if not isinstance(component, str) or component not in names
        ]
    return issues


def _cloud_prompt_options(options: PromptOptions | None) -> dict[str, Any] | None:
    picked: dict[str, Any] = {}
    if options:
        if options.get("examples") is not None:
            picked["examples"] = options["examples"]
        if options.get("preamble"):
            picked["preamble"] = options["preamble"]
        if options.get("additional_rules") is not None:
            picked["additionalRules"] = options["additional_rules"]
    return picked or None


def cloud_config(
    library: Mapping[str, Any], prompt_options: PromptOptions | None = None
) -> dict[str, Any]:
    """`generateSystemPrompt({ cloud: true, library, promptOptions })`'s JSON: your library
    without its `components`, and the prompt options OpenUI Cloud reads. Raises ValueError for
    an invalid library."""
    issues = validate_chat_library(library)
    if issues:
        raise ValueError(f"[generateSystemPrompt] Invalid library: {' '.join(issues)}")
    config: dict[str, Any] = {
        "chatLibrary": {key: value for key, value in library.items() if key != "components"}
    }
    options = _cloud_prompt_options(prompt_options)
    if options:
        config["systemPromptOptions"] = options
    return config


def config_block(config: Mapping[str, Any]) -> str:
    return CONFIG_MARKER + json_text(config)
