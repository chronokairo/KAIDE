// ─── Triggers (Recurring Tasks) ───────────────────────────────────────────────

export type TriggerFn = () => Promise<void> | void

export type TriggerConfig = {
  name: string
  interval: number // milliseconds
  fn: TriggerFn
  immediate?: boolean // run immediately on start
  catchUp?: boolean // run missed executions
}

export type Trigger = {
  id: string
  name: string
  interval: number
  fn: TriggerFn
  immediate: boolean
  catchUp: boolean
  lastRun?: number
  nextRun: number
  running: boolean
  enabled: boolean
  runCount: number
  errorCount: number
  lastError?: Error
}

export class TriggerRunner {
  private triggers: Map<string, Trigger> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private readonly onMessage?: (message: any) => Promise<void>

  constructor(options?: { onMessage?: (message: any) => Promise<void> }) {
    this.onMessage = options?.onMessage
  }

  /**
   * Start a trigger (adds to runner but doesn't schedule)
   */
  start(config: TriggerConfig): string {
    const id = config.name
    const trigger: Trigger = {
      id,
      name: config.name,
      interval: config.interval,
      fn: config.fn,
      immediate: config.immediate ?? false,
      catchUp: config.catchUp ?? false,
      nextRun: config.immediate ? Date.now() : Date.now() + config.interval,
      running: false,
      enabled: true,
      runCount: 0,
      errorCount: 0,
    }

    this.triggers.set(id, trigger)
    this.scheduleTrigger(trigger)

    return id
  }

  /**
   * Stop and remove a trigger
   */
  stop(id: string): void {
    const trigger = this.triggers.get(id)
    if (trigger) {
      this.unscheduleTrigger(id)
      trigger.enabled = false
      this.triggers.delete(id)
    }
  }

  /**
   * Pause a trigger without removing it
   */
  pause(id: string): void {
    const trigger = this.triggers.get(id)
    if (trigger) {
      trigger.enabled = false
      this.unscheduleTrigger(id)
    }
  }

  /**
   * Resume a paused trigger
   */
  resume(id: string): void {
    const trigger = this.triggers.get(id)
    if (trigger && !trigger.enabled) {
      trigger.enabled = true
      trigger.nextRun = Date.now() + trigger.interval
      this.scheduleTrigger(trigger)
    }
  }

  /**
   * Run a trigger immediately
   */
  async runNow(id: string): Promise<void> {
    const trigger = this.triggers.get(id)
    if (!trigger) {
      throw new Error(`Trigger not found: ${id}`)
    }

    await this.executeTrigger(trigger)
  }

  /**
   * Get all triggers
   */
  list(): Trigger[] {
    return Array.from(this.triggers.values())
  }

  /**
   * Get trigger by ID
   */
  get(id: string): Trigger | undefined {
    return this.triggers.get(id)
  }

  /**
   * Stop all triggers
   */
  stopAll(): void {
    for (const id of this.timers.keys()) {
      this.stop(id)
    }
  }

  private scheduleTrigger(trigger: Trigger): void {
    if (!trigger.enabled) return

    const timeout = setTimeout(async () => {
      await this.executeTrigger(trigger)
    }, trigger.nextRun - Date.now())

    this.timers.set(trigger.id, timeout)
  }

  private unscheduleTrigger(id: string): void {
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
  }

  private async executeTrigger(trigger: Trigger): Promise<void> {
    if (!trigger.enabled || trigger.running) return

    trigger.running = true
    trigger.lastRun = Date.now()
    trigger.runCount++

    try {
      await trigger.fn()
    } catch (error) {
      trigger.errorCount++
      trigger.lastError = error instanceof Error ? error : new Error(String(error))
    } finally {
      trigger.running = false
      trigger.nextRun = Date.now() + trigger.interval
      this.scheduleTrigger(trigger)
    }

    // Optionally send message to agent
    if (this.onMessage) {
      await this.onMessage({
        type: 'trigger_executed',
        trigger: trigger.name,
        runCount: trigger.runCount,
      })
    }
  }
}

// ─── Convenience Functions ────────────────────────────────────────────────────

let defaultRunner: TriggerRunner | null = null

function getDefaultRunner(): TriggerRunner {
  if (!defaultRunner) {
    defaultRunner = new TriggerRunner()
  }
  return defaultRunner
}

/**
 * Start a recurring trigger
 */
export function every(intervalMs: number, fn: TriggerFn, name?: string): string {
  return getDefaultRunner().start({
    name: name || `trigger_${Date.now()}`,
    interval: intervalMs,
    fn,
  })
}

/**
 * Stop a trigger
 */
export function stopTrigger(id: string): void {
  getDefaultRunner().stop(id)
}

/**
 * Run a trigger immediately
 */
export async function runTrigger(id: string): Promise<void> {
  await getDefaultRunner().runNow(id)
}

/**
 * Get all triggers
 */
export function getTriggers(): Trigger[] {
  return getDefaultRunner().list()
}
