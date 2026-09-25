import type {
  BetaRawMessageStreamEvent,
  Stream,
  RetryOptions,
  ClientOptions,
} from './types.js';
import {
  ChronoKairoError,
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  RateLimitError,
  InternalServerError,
  MaxRetriesExceededError,
} from './errors.js';
import { withRetry, shouldRetryError, calculateDelay, sleep } from './retry.js';
import { RateLimiter } from 'limiter';

// ─── SSE stream parser ────────────────────────────────────────────────────────

async function* parseSSE(response: Response): AsyncGenerator<BetaRawMessageStreamEvent> {
  if (!response.body) throw new APIConnectionError('Response has no body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') return
          try {
            yield JSON.parse(data) as BetaRawMessageStreamEvent
          } catch {
            // skip malformed SSE frames
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ─── Error factory ────────────────────────────────────────────────────────────

async function throwFromResponse(response: Response): Promise<never> {
  let body: { error?: { type?: string; message?: string } } = {}
  try { body = await response.json() } catch { /* ignore */ }

  const err = body.error
  switch (response.status) {
    case 401: throw new AuthenticationError(err?.message)
    case 429: throw new RateLimitError(err?.message)
    case 500:
    case 529: throw new InternalServerError(err?.message)
    default:  throw APIError.fromResponse(response, err)
  }
}

// ─── Beta Messages API ────────────────────────────────────────────────────────

import type { BetaMessageStreamParams } from './types.js'

class BetaMessages {
  constructor(
    private readonly apiKey: string,
    private readonly baseURL: string,
    private readonly defaultHeaders: Record<string, string>,
    private readonly timeout: number,
    private readonly fetcher: typeof globalThis.fetch,
    private readonly maxRetries: number,
  ) {}

  async create(params: BetaMessageStreamParams, options?: { retry?: Partial<RetryOptions> }): Promise<Stream<BetaRawMessageStreamEvent>> {
    const retryOptions: RetryOptions = {
      maxRetries: this.maxRetries,
      ...options?.retry,
    }

    return withRetry(
      async () => {
        return this.createInternal(params)
      },
      retryOptions,
    )
  }

  private async createInternal(params: BetaMessageStreamParams): Promise<Stream<BetaRawMessageStreamEvent>> {
    // Apply rate limiting
    await this.rateLimitRequest();

    const { betas, ...body } = params as BetaMessageStreamParams & { betas?: string[] };

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      ...this.defaultHeaders,
    };

    if (betas?.length) {
      headers['anthropic-beta'] = betas.join(',');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await this.fetcher(`${this.baseURL}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new APIConnectionTimeoutError();
      }
      throw new APIConnectionError(err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      await throwFromResponse(response);
    }

    return parseSSE(response) as unknown as Stream<BetaRawMessageStreamEvent>;
  }
}

class Beta {
  messages: BetaMessages

  constructor(
    apiKey: string,
    baseURL: string,
    headers: Record<string, string>,
    timeout: number,
    fetcher: typeof globalThis.fetch,
    maxRetries: number,
  ) {
    this.messages = new BetaMessages(apiKey, baseURL, headers, timeout, fetcher, maxRetries)
  }
}

// ─── Main Chronokairo client ──────────────────────────────────────────────────

import type { ClientOptions } from './types.js'

const DEFAULT_BASE_URL = 'https://api.chronokairo.com.br/v1'
const DEFAULT_TIMEOUT = 60_000
const DEFAULT_MAX_RETRIES = 2

export class ChronokairosClient {
  beta: Beta;

  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly maxRetries: number;
  private readonly timeout: number;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly defaultHeaders: Record<string, string>;
  private readonly rateLimiter: RateLimiter;

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey ?? options.authToken ?? process.env.ANTHROPIC_API_KEY ?? '';
    this.baseURL = (options.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};

    // Configure rate limiter: 10 requests per second by default
    const tokensPerInterval = options.rateLimit?.tokensPerInterval ?? 10;
    const interval = options.rateLimit?.interval ?? 'second';
    this.rateLimiter = new RateLimiter({ tokensPerInterval, interval });

    this.beta = new Beta(
      this.apiKey,
      this.baseURL,
      this.defaultHeaders,
      this.timeout,
      this.fetcher,
      this.maxRetries,
    );
  }

  /**
   * Apply rate limiting to a request
   */
  private async rateLimitRequest() {
    await this.rateLimiter.removeTokens(1);
  }

  /**
   * Chat with streaming response - returns an async iterable of tokens
   */
  async chatStream(
    prompt: string,
    options?: {
      model?: string
      maxTokens?: number
      temperature?: number
    },
  ): Promise<AsyncGenerator<string>> {
    const stream = await this.beta.messages.create({
      stream: true,
      max_tokens: options?.maxTokens ?? 1024,
      messages: [{ role: 'user', content: prompt }],
      model: options?.model ?? 'default',
      temperature: options?.temperature,
    })

    async function* tokenGenerator() {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && 'delta' in event) {
          const delta = event.delta as { text?: string }
          if (delta.text) {
            yield delta.text
          }
        }
      }
    }

    return tokenGenerator()
  }

  /**
   * Access to raw HTTP responses
   */
  get raw() {
    return {
      beta: this.beta,
    }
  }
}

// ─── Async Client (Context Manager Pattern) ───────────────────────────────────

export class ChronokairosAsyncClient extends ChronokairosClient {
  private _closed = false

  constructor(options: ClientOptions = {}) {
    super(options)
  }

  async start(): Promise<void> {
    // Initialization logic if needed
    this._closed = false
  }

  async close(): Promise<void> {
    // Cleanup logic if needed
    this._closed = true
  }

  isClosed(): boolean {
    return this._closed
  }

  [Symbol.asyncIterator](): AsyncIterator<ChronokairosAsyncClient> {
    let initialized = false
    const self = this

    return {
      async next() {
        if (!initialized) {
          await self.start()
          initialized = true
          return { done: false, value: self }
        }
        return { done: true, value: undefined }
      },
      async return() {
        await self.close()
        return { done: true, value: undefined }
      },
      async throw(error?: any) {
        await self.close()
        throw error
      },
    }
  }
}

export default ChronokairosClient
