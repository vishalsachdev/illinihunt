#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install Node.js dependencies (uses cache-friendly npm install)
cd "$CLAUDE_PROJECT_DIR"
npm install

# Install gh CLI if not present
if ! command -v gh &>/dev/null; then
  GH_VERSION="2.65.0"
  GH_ARCHIVE="gh_${GH_VERSION}_linux_amd64.tar.gz"
  TMP_DIR=$(mktemp -d)
  wget -q "https://github.com/cli/cli/releases/download/v${GH_VERSION}/${GH_ARCHIVE}" -O "${TMP_DIR}/${GH_ARCHIVE}"
  tar -xzf "${TMP_DIR}/${GH_ARCHIVE}" -C "${TMP_DIR}"
  cp "${TMP_DIR}/gh_${GH_VERSION}_linux_amd64/bin/gh" /usr/local/bin/gh
  chmod +x /usr/local/bin/gh
  rm -rf "${TMP_DIR}"
fi
