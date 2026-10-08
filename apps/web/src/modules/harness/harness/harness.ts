export interface SectorToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface SectorToolSet {
  id: string;
  name: string;
  keywords: string[];
  toolDefs: SectorToolDefinition[];
  instruction?: string;
  execute(name: string, args: Record<string, unknown>): Promise<string | null>;
}

export interface SectorRouteResult {
  sectorId: string | null;
  sectorName: string | null;
}

export class ToolSectorHarness {
  private sectors: Map<string, SectorToolSet> = new Map();

  register(sector: SectorToolSet): void {
    this.sectors.set(sector.id, sector);
  }

  getAllToolDefs(): SectorToolDefinition[] {
    const defs: SectorToolDefinition[] = [];
    for (const sector of this.sectors.values()) {
      defs.push(...sector.toolDefs);
    }
    return defs;
  }

  detectSector(text: string): SectorRouteResult {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    for (const sector of this.sectors.values()) {
      for (const kw of sector.keywords) {
        if (normalized.includes(kw)) {
          return { sectorId: sector.id, sectorName: sector.name };
        }
      }
    }

    return { sectorId: null, sectorName: null };
  }

  detectSectorFromHistory(messages: Array<{ role: string; content: string }>): SectorRouteResult {
    for (const msg of messages) {
      if (msg.role === 'user' && msg.content) {
        const result = this.detectSector(msg.content);
        if (result.sectorId) return result;
      }
    }
    return { sectorId: null, sectorName: null };
  }

  async executeTool(name: string, argsJson: string): Promise<string | null> {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(argsJson) as Record<string, unknown>;
    } catch {}

    for (const sector of this.sectors.values()) {
      const result = await sector.execute(name, args);
      if (result !== null) return result;
    }

    return null;
  }

  getSectorInstruction(sectorId: string): string {
    for (const sector of this.sectors.values()) {
      if (sector.id === sectorId && sector.instruction) {
        return sector.instruction;
      }
    }
    return '';
  }
}
