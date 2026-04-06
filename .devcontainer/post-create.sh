#!/usr/bin/env bash
# Local devcontainer post-create setup (Jörn's Ubuntu desktop).

set -euo pipefail

echo "[post-create] Local devcontainer post-create..."

# Ensure user directories exist and are owned by the dev user.
# Use chown without -R: bind-mounted caches (.cache/npm, .claude) can be
# gigabytes and recursive chown would hang for minutes.
sudo mkdir -p \
  "${HOME}/.config" \
  "${HOME}/.local" \
  "${HOME}/.cache"
sudo chown "${USER}:${USER}" \
  "${HOME}/.config" \
  "${HOME}/.local" \
  "${HOME}/.cache"

# Fix ownership of Docker volume mounts (created as root by default)
sudo chown "${USER}:${USER}" "${HOME}/.vscode" 2>/dev/null || true

# Configure npm paths
if command -v npm >/dev/null 2>&1; then
  mkdir -p "${HOME}/.local/bin" "${HOME}/.cache/npm"
  npm config set prefix "${HOME}/.local"
  npm config set cache "${HOME}/.cache/npm"
fi

# Configure git credentials via GitHub CLI
if command -v gh >/dev/null 2>&1; then
  gh auth setup-git || true
fi

# Install Claude Code CLI
curl -fsSL https://claude.ai/install.sh | bash

# Source .env into shell profile (secrets like API keys)
DOTENV_SOURCE='
# Load project .env if present
if [ -f /workspaces/sporelike/.env ]; then
  set -a; source /workspaces/sporelike/.env; set +a
fi'
if ! grep -q 'source /workspaces/sporelike/.env' "${HOME}/.bashrc" 2>/dev/null; then
  echo "$DOTENV_SOURCE" >> "${HOME}/.bashrc"
fi

# Install project dependencies
if [ -d /workspaces/sporelike/frontend ]; then
  echo "[post-create] Installing frontend dependencies..."
  (cd /workspaces/sporelike/frontend && npm install)
fi
if [ -d /workspaces/sporelike/worker ]; then
  echo "[post-create] Installing worker dependencies..."
  (cd /workspaces/sporelike/worker && npm install)
fi

# tmux config for Claude Code TUI compatibility
# Based on https://github.com/sethdford/tmux-claude-code
cat > ~/.tmux.conf << 'TMUXCONF'
set -g mouse on
set -g status off
set -g set-titles on
set -g set-titles-string "[#S] #{pane_title}"
set -g @scroll-down-exit-copy-mode off

# Claude Code fixes
set -g allow-passthrough on
set -sg escape-time 0
set -g extended-keys always
set -as terminal-features 'xterm*:extkeys'
set -as terminal-features 'xterm-kitty:extkeys'
set -g set-clipboard on
set -g history-limit 250000
set -g focus-events on
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"

# Bell passthrough — lets CC terminal_bell reach the outer terminal
set -g bell-action any
set -g visual-bell on
set -g monitor-bell on

# Copy mode styling (readable on light background)
set -g mode-style "bg=#a8d1ff,fg=#000000"
TMUXCONF

# Safe delete wrapper — redirects rm to trash-put (use /bin/rm for real deletes)
# Requires .Trash-1000/ in .gitignore to avoid committing trashed files.
if ! grep -q 'trash-put' ~/.bashrc 2>/dev/null; then
  cat >> ~/.bashrc << 'BASHRC'

# Safe delete: redirect rm to trash-put (use /bin/rm for real deletes)
rm() { trash-put "$@"; }
export -f rm
BASHRC
fi

# Verify tools
echo "[post-create] code-tunnel: $(code-tunnel --version 2>/dev/null || echo 'not found')"
echo "[post-create] node: $(node -v 2>/dev/null || echo 'not found')"
echo "[post-create] npm: $(npm -v 2>/dev/null || echo 'not found')"
echo "[post-create] gitleaks: $(gitleaks version 2>/dev/null || echo 'not found')"

echo "[post-create] Local post-create complete."
