#!/usr/bin/env bash
# Build do Kaide iOS (apps/ios) no WSL via xtool — sem runner do GitHub.
#
# Gera Kaide-<versão>.ipa / .tipa fake-assinados com `ldid -S`
# (prontos para instalar no TrollStore).
#
# Uso:
#   bash apps/ios/build_wsl_xtool.sh            # release (default)
#   bash apps/ios/build_wsl_xtool.sh debug      # debug
#
# Pré-requisitos (WSL Ubuntu desta máquina):
#   - Swift em /opt/swift, xtool em /usr/local/bin, ldid em /usr/local/bin
#   - SDK Darwin em ~/.swiftpm/swift-sdks/darwin.artifactbundle
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

export PATH="/opt/swift/usr/bin:/usr/local/bin:${PATH}"

CONFIG="${1:-release}"
SDK_DIR="${SDK_DIR:-$HOME/.swiftpm/swift-sdks/darwin.artifactbundle}"

if [ ! -d "$SDK_DIR" ]; then
  echo "ERRO: SDK Darwin ausente em $SDK_DIR." >&2
  echo "Gere com: xtool sdk build <Xcode.xip> /opt/ios-sdk && \\" >&2
  echo "          cp -r /opt/ios-sdk/darwin.xtoolsdk $SDK_DIR" >&2
  exit 1
fi

VERSION="$(python3 - <<'PY'
import plistlib
with open("App/Info.plist", "rb") as fh:
    plist = plistlib.load(fh)
print(plist.get("CFBundleShortVersionString", "0.0.0"))
PY
)"
BUILD_NUMBER="$(python3 - <<'PY'
import plistlib
with open("App/Info.plist", "rb") as fh:
    plist = plistlib.load(fh)
print(plist.get("CFBundleVersion", "1"))
PY
)"
OUT_IPA="Kaide-${VERSION}.ipa"
OUT_TIPA="Kaide-${VERSION}.tipa"

echo "==> app:    $APP_DIR"
echo "==> config: $CONFIG"
echo "==> versão: $VERSION (build $BUILD_NUMBER)"

echo "==> [1/4] xtool dev build ($CONFIG, ipa)"
rm -f ./*.ipa ./*.tipa "$OUT_IPA" "$OUT_TIPA"
rm -rf xtool
xtool dev build -c "$CONFIG" --ipa

IPA="$(find . -maxdepth 3 -name '*.ipa' | head -1)"
if [ -z "$IPA" ]; then
  echo "ERRO: xtool não gerou .ipa." >&2
  exit 1
fi
echo "    ipa: $IPA"

echo "==> [2/4] ldid -S (fake-sign para TrollStore)"
TMP="$(mktemp -d)"
unzip -q "$IPA" -d "$TMP"
APP="$(find "$TMP/Payload" -maxdepth 1 -name '*.app' | head -1)"
if [ -z "$APP" ]; then
  echo "ERRO: .app não encontrado dentro do ipa." >&2
  exit 1
fi
EXEC="$(basename "$APP" .app)"
ldid -S "$APP/$EXEC"

echo "==> [3/4] ícones no bundle"
cp -f App/AppIcon.png App/AppIcon60x60@2x.png "$APP/" 2>/dev/null || true

echo "==> [4/4] empacotando $OUT_IPA / $OUT_TIPA"
STAGE="$(mktemp -d)"
mkdir "$STAGE/Payload"
cp -R "$APP" "$STAGE/Payload/"
( cd "$STAGE" && zip -qr "$APP_DIR/$OUT_IPA" Payload )
cp "$OUT_IPA" "$OUT_TIPA"
rm -rf "$TMP" "$STAGE"

ls -la "$OUT_IPA" "$OUT_TIPA"
echo "OK — instale o $OUT_TIPA no TrollStore."
