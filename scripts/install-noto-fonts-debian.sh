#!/usr/bin/env bash
# Debian/Ubuntu: system-wide Noto fonts for Playwright/Chromium PDF Arabic shaping.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y fonts-noto fonts-noto-cjk fonts-noto-color-emoji || true
# Some distros use fonts-noto-extra (metapackage); ignore if unavailable
apt-get install -y fonts-noto-extra 2>/dev/null || true
fc-cache -f -v
