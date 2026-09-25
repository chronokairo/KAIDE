'use strict'
const path = require('path')
const fs = require('fs')

const arch = process.arch
const plat = process.platform === 'win32' ? 'win32' : process.platform
const bin  = process.platform === 'win32' ? 'rg.exe' : 'rg'

const bundledPath = path.join(__dirname, 'bin', `${arch}-${plat}`, bin)

function resolveRgPath() {
  if (fs.existsSync(bundledPath)) {
    return bundledPath
  }

  // Fallback: use @vscode/ripgrep when bundled binary is not present
  try {
    const vscRipgrep = require('@vscode/ripgrep')
    if (vscRipgrep.rgPath && fs.existsSync(vscRipgrep.rgPath)) {
      return vscRipgrep.rgPath
    }
  } catch {}

  return bundledPath
}

const rgPath = resolveRgPath()

module.exports = { rgPath }
