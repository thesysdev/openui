"""OpenUI Cloud's config block for a dashboard (`artifacts/dashboards/config.ts`)."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Any

from ...core.cloud_config import PromptOptions, cloud_config, config_block


def artifact_config(
    library: Mapping[str, Any], prompt_options: PromptOptions | None
) -> Callable[[dict[str, Any]], str]:
    """The config block for each dashboard call: your library and prompt options, plus the
    call's own `artifact` key (data tools, title or edit target). Checked once, so an invalid
    library fails when the dashboard is defined."""
    base = cloud_config(library, prompt_options)
    return lambda artifact: config_block({**base, "artifact": artifact})
