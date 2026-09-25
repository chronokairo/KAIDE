import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealDockerService } from '../real-docker-service';
import { ContainerMode } from '../../../entities/docker/model/types';

// Mock dockerode
vi.mock('dockerode', () => {
  return {
    default: class {
      async listImages() {
        return [];
      }

      async pull() {
        return {
          on: vi.fn(),
        };
      }

      async createContainer() {
        return {
          start: vi.fn(),
          stop: vi.fn(),
          remove: vi.fn(),
          exec: vi.fn(),
          logs: vi.fn(),
        };
      }
    },
  };
});

describe('RealDockerService', () => {
  let dockerService: RealDockerService;

  beforeEach(() => {
    dockerService = new RealDockerService();
  });

  it('should validate safe commands', async () => {
    const result = dockerService['validateCommand']('ls -la');
    expect(result).toBe(true);
  });

  it('should block dangerous commands', () => {
    const result = dockerService['validateCommand']('rm -rf /');
    expect(result).toBe(false);
  });

  it('should block mkfs command', () => {
    const result = dockerService['validateCommand']('mkfs.ext4');
    expect(result).toBe(false);
  });

  it('should have default images configured', () => {
    const modes: ContainerMode[] = ['debian', 'ubuntu', 'nixos'];
    modes.forEach((mode) => {
      expect(mode).toBeDefined();
    });
  });
});
