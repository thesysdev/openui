#!/bin/bash
set -euo pipefail

# OpenClaw OS Installer (macOS / Linux)
# Install:   curl -fsSL https://openui.com/openclaw-os/install.sh | bash
# Uninstall: curl -fsSL https://openui.com/openclaw-os/install.sh | bash -s -- uninstall

# Suppress corepack's interactive download prompt — there is no TTY in `curl | bash`.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

PREFIX="[openclaw-os]"
REPO="thesysdev/openclaw-os"
SRC_DIR="$HOME/.openclaw/openui/openclaw-os"
PLUGIN_DIR="$SRC_DIR/packages/claw-plugin"
PLUGIN_ID="openclaw-os-plugin"
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"

BOLD='\033[1m'
ACCENT='\033[38;2;255;77;77m'
INFO='\033[38;2;136;146;176m'
SUCCESS='\033[38;2;0;229;204m'
WARN='\033[38;2;255;176;32m'
ERROR='\033[38;2;230;57;70m'
NC='\033[0m'

log()  { printf "${INFO}%s${NC} %s\n" "$PREFIX" "$1"; }
ok()   { printf "${SUCCESS}%s${NC} %s\n" "$PREFIX" "$1"; }
warn() { printf "${WARN}%s WARNING:${NC} %s\n" "$PREFIX" "$1"; }
fatal(){ printf "${ERROR}%s ERROR:${NC} %s\n" "$PREFIX" "$1" >&2; exit 1; }
step() { printf "\n${BOLD}${ACCENT}==>${NC} ${BOLD}%s${NC}\n" "$1"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fatal "$2"
}

banner() {
  printf "\n${BOLD}${ACCENT}OpenClaw OS${NC} ${INFO}— Generative UI for OpenClaw${NC}\n\n"
}

check_prereqs() {
  step "Checking prerequisites"
  require_cmd openclaw "OpenClaw CLI not found. Install it first: https://openclaw.ai/install.sh"
  require_cmd node "Node.js not found. Install Node 22+ from https://nodejs.org"
  require_cmd npx "npx not found. Reinstall Node.js to get npx."

  if ! command -v pnpm >/dev/null 2>&1; then
    log "pnpm not found, installing via corepack…"
    corepack enable >/dev/null 2>&1 || npm install -g pnpm >/dev/null 2>&1 \
      || fatal "Could not install pnpm. Install manually: npm i -g pnpm"
  fi

  local node_major
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$node_major" -lt 22 ]]; then
    fatal "Node $node_major detected. OpenClaw OS plugin requires Node 22+."
  fi

  ok "openclaw $(openclaw --version 2>/dev/null | head -1) · node $(node --version) · pnpm $(pnpm --version)"
}

download_source() {
  step "Downloading OpenClaw OS source ($REPO)"

  mkdir -p "$HOME/.openclaw/openui"
  if [[ -d "$SRC_DIR" ]]; then
    log "Removing previous source at $SRC_DIR"
    rm -rf "$SRC_DIR"
  fi

  npx -y degit "$REPO" "$SRC_DIR" || fatal "degit failed for $REPO. Check network and that the repo is public."

  [[ -f "$PLUGIN_DIR/openclaw.plugin.json" ]] \
    || fatal "Downloaded source is missing $PLUGIN_DIR/openclaw.plugin.json. Repo layout may have changed."

  ok "Downloaded to $SRC_DIR"
}

build_plugin() {
  step "Building plugin (pnpm install + bundle-ui + build)"
  log "This compiles the claw-client UI and bundles the plugin. Expect 1–3 minutes on first run."

  ( cd "$SRC_DIR" && pnpm install --no-frozen-lockfile ) \
    || fatal "Workspace pnpm install failed. See output above."

  # Run the README's canonical sequence explicitly rather than relying on the `prepack`
  # lifecycle, so a future package.json rename can't silently no-op the build.
  ( cd "$PLUGIN_DIR" && pnpm bundle-ui && pnpm build ) \
    || fatal "Plugin build failed (bundle-ui or build). See output above."

  [[ -f "$PLUGIN_DIR/dist/index.js" ]] || fatal "Build did not produce dist/index.js."
  [[ -d "$PLUGIN_DIR/static" ]]        || fatal "Build did not produce static/ (claw-client UI)."

  ok "Built plugin: dist/ + static/ ready"
}

shrink_source() {
  step "Removing node_modules (pnpm symlinks trip openclaw's install scanner)"
  # Recursive — catches nested workspaces too, not just one level under packages/.
  find "$SRC_DIR" -type d -name node_modules -prune -exec rm -rf {} + 2>/dev/null || true
  ok "node_modules removed (built artifacts kept)"
}

install_plugin() {
  step "Registering plugin with OpenClaw"

  openclaw plugins install "$PLUGIN_DIR" --force \
    || fatal "openclaw plugins install failed. Run with --verbose for detail."

  ok "Plugin installed"
}

ensure_tools_allowed() {
  step "Ensuring plugin tools are accessible"

  if [[ ! -f "$OPENCLAW_CONFIG" ]]; then
    warn "OpenClaw config not found at $OPENCLAW_CONFIG, skipping"
    return
  fi

  if ! command -v jq >/dev/null 2>&1; then
    warn "jq not found, skipping tool-policy patch. If plugin tools are blocked, add 'group:plugins' to tools.alsoAllow in $OPENCLAW_CONFIG manually."
    return
  fi

  local profile alsoAllow
  profile=$(jq -r '.tools.profile // empty' "$OPENCLAW_CONFIG")
  alsoAllow=$(jq -r '(.tools.alsoAllow // []) | join(",")' "$OPENCLAW_CONFIG")

  if [[ -z "$profile" || "$profile" == "full" ]]; then
    log "No restrictive tool profile, no patch needed"
    return
  fi

  if [[ ",$alsoAllow," == *",group:plugins,"* ]]; then
    log "tools.alsoAllow already includes group:plugins"
    return
  fi

  local tmp
  tmp=$(mktemp)
  jq '.tools.alsoAllow = ((.tools.alsoAllow // []) + ["group:plugins"])' "$OPENCLAW_CONFIG" > "$tmp" \
    && mv "$tmp" "$OPENCLAW_CONFIG"
  ok "Added group:plugins to tools.alsoAllow (profile=$profile)"
}

restart_gateway() {
  step "Restarting OpenClaw gateway"
  if openclaw gateway restart 2>&1; then
    ok "Gateway restarted"
  else
    warn "Could not restart gateway automatically. Run: openclaw gateway restart"
  fi
}

verify() {
  step "Verifying installation"
  local found=""
  if command -v jq >/dev/null 2>&1; then
    found=$(openclaw plugins list --json 2>/dev/null \
      | jq -r --arg id "$PLUGIN_ID" '.. | select(.id? == $id) | "\(.id) status=\(.status) enabled=\(.enabled)"' \
      | head -1)
  else
    found=$(openclaw plugins list --json 2>/dev/null | tr -d '\n ' | grep -o "\"id\":\"$PLUGIN_ID\"" | head -1)
  fi

  if [[ -n "$found" ]]; then
    ok "$PLUGIN_ID registered ($found)"
  else
    fatal "$PLUGIN_ID not visible in 'openclaw plugins list --json'. Run: openclaw plugins list --json | grep $PLUGIN_ID"
  fi
}

uninstall_plugin() {
  step "Disabling $PLUGIN_ID"
  if openclaw plugins disable "$PLUGIN_ID" 2>&1; then
    ok "Plugin disabled"
  else
    warn "Could not disable plugin (may not be installed). Continuing."
  fi

  step "Uninstalling $PLUGIN_ID"
  if openclaw plugins uninstall "$PLUGIN_ID" 2>&1; then
    ok "Plugin uninstalled"
  else
    warn "Could not uninstall plugin (may not be registered). Continuing."
  fi
}

remove_source() {
  step "Removing source at $SRC_DIR"
  if [[ -d "$SRC_DIR" ]]; then
    rm -rf "$SRC_DIR"
    ok "Removed $SRC_DIR"
  else
    log "Source dir not present, skipping"
  fi
}

remove_legacy_global_install() {
  local legacy="$HOME/.openclaw/extensions/$PLUGIN_ID"
  if [[ -d "$legacy" ]]; then
    step "Removing legacy global install at $legacy"
    rm -rf "$legacy"
    ok "Removed $legacy"
  fi
}

do_install() {
  banner
  check_prereqs
  download_source
  build_plugin
  shrink_source
  install_plugin
  ensure_tools_allowed
  restart_gateway
  verify

  printf "\n${SUCCESS}${BOLD}✓ OpenClaw OS installed.${NC}\n"
  printf "${INFO}  Open the Claw UI from your OpenClaw client to start generating apps.${NC}\n\n"
}

do_uninstall() {
  banner
  require_cmd openclaw "OpenClaw CLI not found — nothing to uninstall."
  uninstall_plugin
  remove_source
  remove_legacy_global_install
  restart_gateway

  printf "\n${SUCCESS}${BOLD}✓ OpenClaw OS uninstalled.${NC}\n\n"
}

main() {
  case "${1:-install}" in
    install)   do_install ;;
    uninstall) do_uninstall ;;
    *) fatal "Unknown command: $1. Use 'install' (default) or 'uninstall'." ;;
  esac
}

main "$@"
