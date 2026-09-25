import Docker from 'dockerode';
import {
  ContainerConfig,
  ContainerMode,
  ContainerExecutionResult,
  ContainerCommand,
  SandboxPolicy,
} from '../../entities/docker/model/types';

const DEFAULT_IMAGES: Record<ContainerMode, string> = {
  debian: 'debian:stable-slim',
  ubuntu: 'ubuntu:22.04',
  nixos: 'nixos/nix:2.18',
};

const DEFAULT_POLICY: SandboxPolicy = {
  allowNetwork: false,
  allowFileSystem: false,
  allowedPaths: ['/workspace'],
  maxMemory: 512 * 1024 * 1024, // 512MB
  maxCpu: 0.5,
  blockedCommands: ['rm -rf /', 'mkfs', 'dd', 'chmod -R 777'],
};

export class RealDockerService {
  private docker: Docker;
  private containers: Map<string, { config: ContainerConfig; container: Docker.Container }> =
    new Map();
  private policy: SandboxPolicy;

  constructor(policy?: SandboxPolicy) {
    // Connect to local Docker daemon (works with Docker Desktop on Windows)
    this.docker = new Docker({ socketPath: '//./pipe/docker_engine' });
    this.policy = policy || DEFAULT_POLICY;
  }

  async createContainer(
    name: string,
    mode: ContainerMode,
    config?: Partial<ContainerConfig>
  ): Promise<ContainerConfig> {
    const id = this.generateContainerId();
    const image = config?.image || DEFAULT_IMAGES[mode];

    try {
      // Pull image if not exists
      await this.ensureImage(image);

      // Create container
      const dockerContainer = await this.docker.createContainer({
        Image: image,
        name: `aegis-${name}-${id}`,
        HostConfig: {
          Memory: this.policy.maxMemory,
          MemorySwap: this.policy.maxMemory,
          CpuQuota: this.policy.maxCpu ? Math.floor(this.policy.maxCpu * 100000) : undefined,
          Mounts: (config?.volumes || ['/workspace:/workspace']).map((volume) => {
            const [src, dst] = volume.split(':');
            return {
              Type: 'bind',
              Source: src,
              Target: dst,
              ReadOnly: false,
            };
          }),
          NetworkMode: this.policy.allowNetwork ? 'bridge' : 'none',
        },
        Env: Object.entries(config?.environment || {}).map(([key, value]) => `${key}=${value}`),
        WorkingDir: '/workspace',
        Cmd: ['/bin/bash', '-c', 'sleep infinity'],
        Tty: true,
        OpenStdin: true,
      } as any);

      const containerConfig: ContainerConfig = {
        id,
        name,
        image,
        mode,
        status: 'pending',
        ports: config?.ports || [],
        volumes: config?.volumes || ['/workspace:/workspace'],
        environment: config?.environment || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.containers.set(id, { config: containerConfig, container: dockerContainer });

      // Start container
      await dockerContainer.start();
      containerConfig.status = 'running';

      return containerConfig;
    } catch (error) {
      throw new Error(
        `Failed to create container: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async startContainer(containerId: string): Promise<void> {
    const entry = this.containers.get(containerId);
    if (!entry) {
      throw new Error(`Container ${containerId} not found`);
    }

    try {
      await entry.container.start();
      entry.config.status = 'running';
      entry.config.updatedAt = new Date();
    } catch (error) {
      throw new Error(
        `Failed to start container: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async stopContainer(containerId: string): Promise<void> {
    const entry = this.containers.get(containerId);
    if (!entry) {
      throw new Error(`Container ${containerId} not found`);
    }

    try {
      await entry.container.stop({ t: 5 });
      entry.config.status = 'stopped';
      entry.config.updatedAt = new Date();
    } catch (error) {
      throw new Error(
        `Failed to stop container: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async executeCommand(command: ContainerCommand): Promise<ContainerExecutionResult> {
    const entry = this.containers.get(command.containerId);
    if (!entry) {
      throw new Error(`Container ${command.containerId} not found`);
    }

    if (!this.validateCommand(command.command)) {
      throw new Error('Command blocked by security policy');
    }

    const startTime = Date.now();

    try {
      const exec = await entry.container.exec({
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ['/bin/bash', '-c', command.command],
        WorkingDir: command.workingDir || '/workspace',
      });

      const stream = await exec.start({ Detach: false });
      let output = '';

      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
        setTimeout(() => {
          stream.destroy();
          reject(new Error(`Command timeout after ${command.timeout || 30000}ms`));
        }, command.timeout || 30000);
      });

      const info = await exec.inspect();

      return {
        success: info.ExitCode === 0,
        output,
        exitCode: info.ExitCode,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  async getContainerLogs(containerId: string): Promise<string> {
    const entry = this.containers.get(containerId);
    if (!entry) {
      throw new Error(`Container ${containerId} not found`);
    }

    try {
      const logs = await entry.container.logs({
        stdout: true,
        stderr: true,
        follow: false,
      });

      return logs.toString();
    } catch (error) {
      throw new Error(
        `Failed to get logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async listContainers(): Promise<ContainerConfig[]> {
    return Array.from(this.containers.values()).map((entry) => entry.config);
  }

  async removeContainer(containerId: string): Promise<void> {
    const entry = this.containers.get(containerId);
    if (!entry) {
      throw new Error(`Container ${containerId} not found`);
    }

    try {
      if (entry.config.status === 'running') {
        await entry.container.stop({ t: 5 });
      }
      await entry.container.remove({ force: true });
      this.containers.delete(containerId);
    } catch (error) {
      throw new Error(
        `Failed to remove container: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private generateContainerId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateCommand(command: string): boolean {
    if (!this.policy.blockedCommands) return true;

    for (const blocked of this.policy.blockedCommands) {
      if (command.includes(blocked)) {
        return false;
      }
    }

    return true;
  }

  private async ensureImage(image: string): Promise<void> {
    try {
      // Check if image exists
      const images = await this.docker.listImages();
      const exists = images.some((img) => img.RepoTags?.includes(image));

      if (!exists) {
        // Pull image
        console.log(`Pulling Docker image: ${image}`);
        const stream = await this.docker.pull(image);

        await new Promise<void>((resolve, reject) => {
          this.docker.modem.followProgress(stream, (err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });

        console.log(`Successfully pulled image: ${image}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to ensure image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
