export interface ConfigOptions {
  // Server
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // Ollama
  ollamaBaseUrl: string;
  ollamaModel: string;
  ollamaTimeout: number;
  
  // Docker
  dockerHost?: string;
  dockerCertPath?: string;
  defaultContainerMode: 'debian' | 'ubuntu' | 'nixos';
  maxContainers: number;
  containerTimeout: number;
  
  // Agent
  maxTaskRetries: number;
  taskTimeout: number;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Security
  enableAuth: boolean;
  apiKeyRequired: boolean;
  corsOrigin: string | string[];
}

class Config {
  private options: ConfigOptions;

  constructor() {
    this.options = this.loadFromEnvironment();
  }

  private loadFromEnvironment(): ConfigOptions {
    return {
      // Server
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      
      // Ollama
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:1b',
      ollamaTimeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10),
      
      // Docker
      dockerHost: process.env.DOCKER_HOST,
      dockerCertPath: process.env.DOCKER_CERT_PATH,
      defaultContainerMode: (process.env.DEFAULT_CONTAINER_MODE as any) || 'ubuntu',
      maxContainers: parseInt(process.env.MAX_CONTAINERS || '5', 10),
      containerTimeout: parseInt(process.env.CONTAINER_TIMEOUT || '300000', 10),
      
      // Agent
      maxTaskRetries: parseInt(process.env.MAX_TASK_RETRIES || '3', 10),
      taskTimeout: parseInt(process.env.TASK_TIMEOUT || '300000', 10),
      
      // Logging
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      
      // Security
      enableAuth: process.env.ENABLE_AUTH === 'true',
      apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
      corsOrigin: process.env.CORS_ORIGIN || '*',
    };
  }

  get(key: keyof ConfigOptions): ConfigOptions[keyof ConfigOptions] {
    return this.options[key];
  }

  getAll(): ConfigOptions {
    return { ...this.options };
  }

  isDevelopment(): boolean {
    return this.options.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.options.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.options.nodeEnv === 'test';
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.options.port < 1 || this.options.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }

    if (this.options.maxContainers < 1) {
      errors.push('maxContainers must be at least 1');
    }

    if (!this.options.ollamaBaseUrl.startsWith('http')) {
      errors.push('ollamaBaseUrl must be a valid HTTP URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const config = new Config();
