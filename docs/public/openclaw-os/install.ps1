# OpenClaw OS Installer (Windows / PowerShell 5.1+)
#
# Install:
#   iwr -useb https://openui.com/openclaw-os/install.ps1 | iex
#
# Uninstall (one-liner):
#   & ([scriptblock]::Create((iwr -useb https://openui.com/openclaw-os/install.ps1).Content)) -Uninstall
#
# Or download then run:
#   iwr https://openui.com/openclaw-os/install.ps1 -OutFile install.ps1
#   ./install.ps1            # install
#   ./install.ps1 -Uninstall # uninstall

param(
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

# Force TLS 1.2 — Windows PowerShell 5.1 defaults to TLS 1.0/1.1, which fails
# against modern HTTPS origins (openui.com, GitHub via npx degit).
[Net.ServicePointManager]::SecurityProtocol =
  [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# Suppress corepack's interactive download prompt — there is no TTY in `iwr | iex`.
$env:COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'

$Prefix         = '[openclaw-os]'
$Repo           = 'thesysdev/openclaw-os'
$SrcDir         = Join-Path $env:USERPROFILE '.openclaw\openui\openclaw-os'
$PluginDir      = Join-Path $SrcDir 'packages\claw-plugin'
$PluginId       = 'openclaw-os-plugin'
$OpenclawConfig = Join-Path $env:USERPROFILE '.openclaw\openclaw.json'
$LegacyDir      = Join-Path $env:USERPROFILE ".openclaw\extensions\$PluginId"

function Write-Log    ($msg) { Write-Host "$Prefix $msg" -ForegroundColor DarkGray }
function Write-Ok     ($msg) { Write-Host "$Prefix $msg" -ForegroundColor Cyan }
function Write-Warn2  ($msg) { Write-Host "$Prefix WARNING: $msg" -ForegroundColor Yellow }
function Write-Fatal  ($msg) { Write-Host "$Prefix ERROR: $msg" -ForegroundColor Red; exit 1 }
function Write-Step   ($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Magenta }

function Test-Cmd($name) {
  $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Require-Cmd($name, $hint) {
  if (-not (Test-Cmd $name)) { Write-Fatal $hint }
}

function Banner {
  Write-Host ""
  Write-Host "OpenClaw OS" -ForegroundColor Magenta -NoNewline
  Write-Host " — Generative UI for OpenClaw" -ForegroundColor DarkGray
  Write-Host ""
}

function Check-Prereqs {
  Write-Step 'Checking prerequisites'
  Require-Cmd 'openclaw' 'OpenClaw CLI not found. Install it first: https://openclaw.ai/install.ps1'
  Require-Cmd 'node'     'Node.js not found. Install Node 22+ from https://nodejs.org'
  Require-Cmd 'npx'      'npx not found. Reinstall Node.js to get npx.'

  if (-not (Test-Cmd 'pnpm')) {
    Write-Log 'pnpm not found, installing via corepack…'
    # Native commands do not throw on non-zero exit; check $LASTEXITCODE explicitly.
    & corepack enable 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Log 'corepack enable failed, falling back to npm install -g pnpm…'
      & npm install -g pnpm 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Write-Fatal 'Could not install pnpm. Install manually: npm i -g pnpm'
      }
    }
  }

  $nodeMajor = [int](node -p 'process.versions.node.split(".")[0]')
  if ($nodeMajor -lt 22) { Write-Fatal "Node $nodeMajor detected. OpenClaw OS plugin requires Node 22+." }

  $oc = (& openclaw --version 2>$null | Select-Object -First 1)
  Write-Ok "openclaw $oc · node $(node --version) · pnpm $(pnpm --version)"
}

function Download-Source {
  Write-Step "Downloading OpenClaw OS source ($Repo)"
  New-Item -ItemType Directory -Force -Path (Split-Path $SrcDir) | Out-Null

  if (Test-Path $SrcDir) {
    Write-Log "Removing previous source at $SrcDir"
    Remove-Item -Recurse -Force $SrcDir
  }

  & npx -y degit $Repo $SrcDir
  if ($LASTEXITCODE -ne 0) { Write-Fatal "degit failed for $Repo. Check network and that the repo is public." }

  if (-not (Test-Path (Join-Path $PluginDir 'openclaw.plugin.json'))) {
    Write-Fatal "Downloaded source missing $PluginDir\openclaw.plugin.json. Repo layout may have changed."
  }
  Write-Ok "Downloaded to $SrcDir"
}

function Build-Plugin {
  Write-Step 'Building plugin (pnpm install + bundle-ui + build)'
  Write-Log 'Compiles claw-client UI and bundles the plugin. Expect 1–3 minutes on first run.'

  Push-Location $SrcDir
  try {
    & pnpm install --no-frozen-lockfile
    if ($LASTEXITCODE -ne 0) { Write-Fatal 'Workspace pnpm install failed.' }
  } finally { Pop-Location }

  # Run README's canonical sequence explicitly, not the `prepack` lifecycle —
  # protects against silent no-op if the package.json script gets renamed.
  Push-Location $PluginDir
  try {
    & pnpm bundle-ui
    if ($LASTEXITCODE -ne 0) { Write-Fatal 'pnpm bundle-ui failed.' }
    & pnpm build
    if ($LASTEXITCODE -ne 0) { Write-Fatal 'pnpm build failed.' }
  } finally { Pop-Location }

  if (-not (Test-Path (Join-Path $PluginDir 'dist\index.js'))) { Write-Fatal 'Build did not produce dist\index.js.' }
  if (-not (Test-Path (Join-Path $PluginDir 'static')))         { Write-Fatal 'Build did not produce static\ (claw-client UI).' }

  Write-Ok 'Built plugin: dist\ + static\ ready'
}

function Shrink-Source {
  Write-Step "Removing node_modules (pnpm symlinks trip openclaw's install scanner)"
  Get-ChildItem -Path $SrcDir -Recurse -Force -Directory -Filter 'node_modules' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    ForEach-Object { Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue }
  Write-Ok 'node_modules removed (built artifacts kept)'
}

function Install-Plugin {
  Write-Step 'Registering plugin with OpenClaw'
  & openclaw plugins install $PluginDir --force
  if ($LASTEXITCODE -ne 0) { Write-Fatal 'openclaw plugins install failed.' }
  Write-Ok 'Plugin installed'
}

function Ensure-ToolsAllowed {
  Write-Step 'Ensuring plugin tools are accessible'
  if (-not (Test-Path $OpenclawConfig)) { Write-Warn2 "OpenClaw config not found at $OpenclawConfig, skipping"; return }

  $cfg = Get-Content -Raw $OpenclawConfig | ConvertFrom-Json

  # Avoid shadowing PowerShell's built-in $profile automatic variable.
  $toolProfile = if ($cfg.tools -and $cfg.tools.profile) { $cfg.tools.profile } else { '' }
  $alsoAllow   = @()
  if ($cfg.tools -and $cfg.tools.alsoAllow) { $alsoAllow = @($cfg.tools.alsoAllow) }

  if (-not $toolProfile -or $toolProfile -eq 'full') { Write-Log 'No restrictive tool profile, no patch needed'; return }
  if ($alsoAllow -contains 'group:plugins') { Write-Log 'tools.alsoAllow already includes group:plugins'; return }

  # Use Add-Member defensively so this works under Set-StrictMode and on configs
  # where `tools` or `tools.alsoAllow` is missing.
  if (-not $cfg.PSObject.Properties['tools']) {
    $cfg | Add-Member -MemberType NoteProperty -Name tools -Value ([pscustomobject]@{})
  }
  if (-not $cfg.tools.PSObject.Properties['alsoAllow']) {
    $cfg.tools | Add-Member -MemberType NoteProperty -Name alsoAllow -Value @()
  }
  $cfg.tools.alsoAllow = @($alsoAllow + 'group:plugins')

  # Force UTF-8 *without* BOM. PS 5.1's `Set-Content -Encoding utf8` writes a BOM,
  # which the gateway's JSON parser may reject.
  $json = $cfg | ConvertTo-Json -Depth 50
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($OpenclawConfig, $json, $utf8NoBom)
  Write-Ok "Added group:plugins to tools.alsoAllow (profile=$toolProfile)"
}

function Restart-Gateway {
  Write-Step 'Restarting OpenClaw gateway'
  # Native commands do not throw on non-zero exit, so try/catch wouldn't fire.
  & openclaw gateway restart
  if ($LASTEXITCODE -eq 0) {
    Write-Ok 'Gateway restarted'
  } else {
    Write-Warn2 'Could not restart gateway automatically. Run: openclaw gateway restart'
  }
}

function Verify {
  Write-Step 'Verifying installation'
  $json = & openclaw plugins list --json 2>$null | Out-String
  if (-not $json) { Write-Fatal 'openclaw plugins list --json returned nothing.' }
  $data = $json | ConvertFrom-Json

  $found = $null
  $stack = New-Object System.Collections.Stack
  $stack.Push($data)
  while ($stack.Count -gt 0) {
    $node = $stack.Pop()
    if ($null -eq $node) { continue }
    if ($node -is [System.Collections.IEnumerable] -and -not ($node -is [string])) {
      foreach ($child in $node) { $stack.Push($child) }
    } elseif ($node.PSObject -and $node.PSObject.Properties) {
      if ($node.PSObject.Properties.Name -contains 'id' -and $node.id -eq $PluginId) { $found = $node; break }
      foreach ($p in $node.PSObject.Properties) { $stack.Push($p.Value) }
    }
  }

  if ($found) {
    Write-Ok "$PluginId registered (status=$($found.status) enabled=$($found.enabled))"
  } else {
    Write-Fatal "$PluginId not visible in 'openclaw plugins list --json'."
  }
}

function Uninstall-Plugin {
  Write-Step "Disabling $PluginId"
  & openclaw plugins disable $PluginId
  if ($LASTEXITCODE -ne 0) { Write-Warn2 'Could not disable plugin (may not be installed). Continuing.' } else { Write-Ok 'Plugin disabled' }

  Write-Step "Uninstalling $PluginId"
  & openclaw plugins uninstall $PluginId
  if ($LASTEXITCODE -ne 0) { Write-Warn2 'Could not uninstall plugin (may not be registered). Continuing.' } else { Write-Ok 'Plugin uninstalled' }
}

function Remove-Source {
  Write-Step "Removing source at $SrcDir"
  if (Test-Path $SrcDir) { Remove-Item -Recurse -Force $SrcDir; Write-Ok "Removed $SrcDir" }
  else { Write-Log 'Source dir not present, skipping' }
}

function Remove-LegacyGlobalInstall {
  if (Test-Path $LegacyDir) {
    Write-Step "Removing legacy global install at $LegacyDir"
    Remove-Item -Recurse -Force $LegacyDir
    Write-Ok "Removed $LegacyDir"
  }
}

function Do-Install {
  Banner
  Check-Prereqs
  Download-Source
  Build-Plugin
  Shrink-Source
  Install-Plugin
  Ensure-ToolsAllowed
  Restart-Gateway
  Verify
  Write-Host ""
  Write-Host "✓ OpenClaw OS installed." -ForegroundColor Cyan
  Write-Host "  Open the Claw UI from your OpenClaw client to start generating apps." -ForegroundColor DarkGray
  Write-Host ""
}

function Do-Uninstall {
  Banner
  Require-Cmd 'openclaw' 'OpenClaw CLI not found — nothing to uninstall.'
  Uninstall-Plugin
  Remove-Source
  Remove-LegacyGlobalInstall
  Restart-Gateway
  Write-Host ""
  Write-Host "✓ OpenClaw OS uninstalled." -ForegroundColor Cyan
  Write-Host ""
}

if ($Uninstall) { Do-Uninstall } else { Do-Install }
