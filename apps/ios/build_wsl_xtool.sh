#!/usr/bin/env bash
# Build do Kaide iOS (apps/ios) no WSL via xtool — sem runner do GitHub.
#
# Gera UM artefato:
#
#   Kaide-<v>.ipa    → sideload / sem jailbreak (ad-hoc, SEM entitlements, sandboxed)
#
# Rede (GitHub / GitLab) usa a API HTTPS com token pessoal configurado no app;
# não é necessário shell, git nem jailbreak.
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

plist_get() {
  python3 - "$1" "$2" <<'PY'
import plistlib, sys
with open(sys.argv[1], "rb") as fh:
    plist = plistlib.load(fh)
print(plist.get(sys.argv[2], ""))
PY
}

VERSION="$(plist_get App/Info.plist CFBundleShortVersionString)"
BUILD_NUMBER="$(plist_get App/Info.plist CFBundleVersion)"
APP_NAME="$(plist_get App/Info.plist CFBundleExecutable)"
OUT_IPA="Kaide-${VERSION}.ipa"

echo "==> app:    $APP_DIR"
echo "==> config: $CONFIG"
echo "==> versão: $VERSION (build $BUILD_NUMBER)"

echo "==> [1/4] xtool dev build ($CONFIG, ipa)"
rm -f ./*.ipa ./*.tipa ./*.deb
rm -rf xtool
xtool dev build -c "$CONFIG" --ipa

IPA="$(find . -maxdepth 3 -name '*.ipa' | head -1)"
if [ -z "$IPA" ]; then
  echo "ERRO: xtool não gerou .ipa." >&2
  exit 1
fi
echo "    ipa: $IPA"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

unzip -q "$IPA" -d "$TMP"
APP="$(find "$TMP/Payload" -maxdepth 1 -name '*.app' | head -1)"
if [ -z "$APP" ]; then
  echo "ERRO: .app não encontrado dentro do ipa." >&2
  exit 1
fi

echo "==> [2/4] ícones no bundle"
cp -f App/AppIcon.png App/AppIcon60x60@2x.png "$APP/" 2>/dev/null || true

echo "==> [3/4] assinatura ad-hoc sem entitlements (sandboxed)"
SANDBOX_APP="$TMP/sandbox/$(basename "$APP")"
mkdir -p "$(dirname "$SANDBOX_APP")"
cp -R "$APP" "$SANDBOX_APP"
ldid -S "$SANDBOX_APP/$APP_NAME"
echo "    entitlements: $(ldid -e "$SANDBOX_APP/$APP_NAME" | grep -c '<key>') chave(s) (esperado: 0)"

echo "==> [4/4] empacotando $OUT_IPA"
pack_ipa() { # <app-dir> <saida>
  local stage
  stage="$(mktemp -d)"
  mkdir "$stage/Payload"
  cp -R "$1" "$stage/Payload/"
  ( cd "$stage" && zip -qr "$APP_DIR/$2" Payload )
  rm -rf "$stage"
}
pack_ipa "$SANDBOX_APP" "$OUT_IPA"

ls -la "$OUT_IPA"
echo "OK — ipa sandboxed: $OUT_IPA"
