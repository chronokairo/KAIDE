'use client'

import { Monitor, Zap, HardDrive, Wifi } from 'lucide-react'

interface SystemInfo {
  cpu: number
  gpu: number
  memory: number
  disk: number
  network: string
}

export default function SystemInfoBar({ systemInfo }: { systemInfo: SystemInfo }) {
  return (
    <div className="flex items-center gap-4 text-xs bg-[var(--bg-secondary)] px-3 py-1 rounded border border-[var(--border)]">
      <div className="flex items-center gap-1.5">
        <Monitor className="w-3 h-3" />
        <span className="text-[var(--text-secondary)]">CPU</span>
        <span className="font-medium">{systemInfo.cpu}%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Monitor className="w-3 h-3" />
        <span className="text-[var(--text-secondary)]">GPU</span>
        <span className="font-medium">{systemInfo.gpu}%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3" />
        <span className="text-[var(--text-secondary)]">RAM</span>
        <span className="font-medium">{systemInfo.memory}%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <HardDrive className="w-3 h-3" />
        <span className="text-[var(--text-secondary)]">Disco</span>
        <span className="font-medium">{systemInfo.disk}%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Wifi className="w-3 h-3" />
        <span className="text-[var(--text-secondary)]">Rede</span>
        <span className="font-medium">{systemInfo.network === 'online' ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  )
}
