#!/usr/bin/env bash
# Build do Kaide iOS (apps/ios) no WSL via xtool — sem runner do GitHub.
#
# Gera TRÊS artefatos com o mesmo binário:
#
#   Kaide-<v>.ipa    → sideload / sem jailbreak (ad-hoc, SEM entitlements, sandboxed)
#   Kaide-<v>.tipa   → TrollStore (ad-hoc + entitlements rootless)
#   Kaide-<v>.deb    → Dopamine / Sileo (rootless, /var/jb/Applications)
#
# Uso:
#   bash apps/ios/build_wsl_xtool.sh            # release (default)
#   bash apps/ios/build_wsl_xtool.sh debug      # debug
#
# Pré-requisitos (WSL Ubuntu desta máquina):
#   - Swift em /opt/swift, xtool em /usr/local/bin, ldid em /usr/local/bin
#   - dpkg-deb (pacote dpkg) para o .deb rootless
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
OUT_TIPA="Kaide-${VERSION}.tipa"
OUT_DEB="Kaide-${VERSION}.deb"
ENT="App/entitlements.plist"

echo "==> app:    $APP_DIR"
echo "==> config: $CONFIG"
echo "==> versão: $VERSION (build $BUILD_NUMBER)"

echo "==> [1/6] xtool dev build ($CONFIG, ipa)"
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
unzip -q "$IPA" -d "$TMP"
APP="$(find "$TMP/Payload" -maxdepth 1 -name '*.app' | head -1)"
if [ -z "$APP" ]; then
  echo "ERRO: .app não encontrado dentro do ipa." >&2
  exit 1
fi

echo "==> [2/6] ícones no bundle"
cp -f App/AppIcon.png App/AppIcon60x60@2x.png "$APP/" 2>/dev/null || true

echo "==> [3/6] ipa sem jailbreak (ad-hoc, sem entitlements)"
SANDBOX_APP="$TMP/sandbox/$(basename "$APP")"
mkdir -p "$(dirname "$SANDBOX_APP")"
cp -R "$APP" "$SANDBOX_APP"
ldid -S "$SANDBOX_APP/$APP_NAME"
echo "    entitlements: $(ldid -e "$SANDBOX_APP/$APP_NAME" | grep -c '<key>') chave(s) (esperado: 0)"

echo "==> [4/6] tipa TrollStore + deb Dopamine (ad-hoc + entitlements rootless)"
ROOTLESS_APP="$TMP/rootless/$(basename "$APP")"
mkdir -p "$(dirname "$ROOTLESS_APP")"
cp -R "$APP" "$ROOTLESS_APP"
if [ -f "$ENT" ]; then
  ldid -S"$ENT" "$ROOTLESS_APP/$APP_NAME"
  echo "    assinado com $ENT"
else
  ldid -S "$ROOTLESS_APP/$APP_NAME"
  echo "    AVISO: $ENT ausente — assinatura sem entitlements (sem acesso rootless)." >&2
fi
echo "    entitlements: $(ldid -e "$ROOTLESS_APP/$APP_NAME" | grep -c '<key>') chave(s)"

pack_ipa() { # <app-dir> <saida>
  local stage
  stage="$(mktemp -d)"
  mkdir "$stage/Payload"
  cp -R "$1" "$stage/Payload/"
  ( cd "$stage" && zip -qr "$APP_DIR/$2" Payload )
  rm -rf "$stage"
}

echo "==> [5/6] empacotando $OUT_IPA / $OUT_TIPA"
pack_ipa "$SANDBOX_APP" "$OUT_IPA"
pack_ipa "$ROOTLESS_APP" "$OUT_TIPA"

echo "==> [6/6] .deb rootless (Dopamine / Sileo)"
if command -v dpkg-deb >/dev/null 2>&1; then
  DEB_ROOT="$(mktemp -d)"
  chmod 0755 "$DEB_ROOT"
  mkdir -p "$DEB_ROOT/var/jb/Applications" "$DEB_ROOT/DEBIAN"
  cp -R "$ROOTLESS_APP" "$DEB_ROOT/var/jb/Applications/"
  find "$DEB_ROOT/var" -type d -exec chmod 0755 {} +
  find "$DEB_ROOT/var/jb/Applications/$(basename "$APP")" -type f -exec chmod 0644 {} +
  chmod 0755 "$DEB_ROOT/var/jb/Applications/$(basename "$APP")/$APP_NAME"
  INSTALLED_SIZE="$(du -sk "$DEB_ROOT/var/jb/Applications/$(basename "$APP")" | cut -f1)"
  cat > "$DEB_ROOT/DEBIAN/control" <<EOF
Package: com.chronokairo.kaide
Name: Kaide
Version: $VERSION
Architecture: iphoneos-arm64
Description: Kaide — agent coding nativo para iOS (SwiftUI + CLI kaide)
Maintainer: Chronokairo <dev@chronokairo.com>
Author: Chronokairo
Section: Applications
Priority: optional
Depends: firmware (>= 15.0)
Installed-Size: $INSTALLED_SIZE
EOF
  cat > "$DEB_ROOT/DEBIAN/postinst" <<'EOF'
#!/bin/sh
uicache -p /var/jb/Applications/Kaide.app >/dev/null 2>&1 || true
exit 0
EOF
  cat > "$DEB_ROOT/DEBIAN/prerm" <<'EOF'
#!/bin/sh
uicache -u /var/jb/Applications/Kaide.app >/dev/null 2>&1 || true
exit 0
EOF
  chmod 0755 "$DEB_ROOT/DEBIAN/postinst" "$DEB_ROOT/DEBIAN/prerm"
  dpkg-deb --root-owner-group -Zxz --build "$DEB_ROOT" "$APP_DIR/$OUT_DEB" >/dev/null
  rm -rf "$DEB_ROOT"
else
  echo "    AVISO: dpkg-deb ausente — .deb não gerado (apt-get install -y dpkg)." >&2
fi

rm -rf "$TMP"

ls -la "$OUT_IPA" "$OUT_TIPA"
if [ -f "$OUT_DEB" ]; then ls -la "$OUT_DEB"; fi
echo "OK — sideload: $OUT_IPA | TrollStore: $OUT_TIPA | Dopamine: $OUT_DEB"
