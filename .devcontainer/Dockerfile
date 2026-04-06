FROM mcr.microsoft.com/devcontainers/base:ubuntu

ENV DEBIAN_FRONTEND=noninteractive

SHELL ["/bin/bash", "-lc"]

# -----------------------------------------------------------------------------
# Local devcontainer image for sporelike (Jörn's Ubuntu desktop)
#
# Design goals:
# - Keep the image simple and close to standard devcontainer patterns (KISS).
# - Install heavyweight, rarely changing dependencies in earlier layers so they
#   are cached across rebuilds.
# -----------------------------------------------------------------------------

# Base system dependencies (rarely change; shared by all tools).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    ca-certificates \
    jq \
    tmux \
    trash-cli \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22.x (npm included) for JS tooling.
# We keep this in the image so that npm is always available for postCreate
# steps without re-downloading Node on each run.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && node -v && npm -v

# VS Code tunnel CLI (bake into image to avoid slow postCreate download)
RUN set -eux; \
    tmpdir="$(mktemp -d)"; \
    curl -fsSL "https://update.code.visualstudio.com/latest/cli-linux-x64/stable" -o "$tmpdir/vscode-cli.tar.gz"; \
    tar -xzf "$tmpdir/vscode-cli.tar.gz" -C "$tmpdir"; \
    install -m 0755 "$tmpdir/code" /usr/local/bin/code-tunnel; \
    rm -rf "$tmpdir"

# gitleaks — secret scanning for git repos
RUN curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/main/scripts/install.sh | sh -s -- -b /usr/local/bin

WORKDIR /workspaces/sporelike
