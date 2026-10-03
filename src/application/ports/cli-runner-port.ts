/**
 * Driven port for running a local command line client.
 *
 * The forge integrations shell out to `gh` and `glab` rather than embedding an
 * HTTP client, so that authentication, proxy settings and rate limit handling
 * stay with the CLIs the developer already trusts. Putting that behind a port
 * means the use cases never see a process, and the tests can run without
 * touching the network.
 */
export interface CliRunnerPort {
  /**
   * Runs a client with an argument array.
   *
   * Implementations must not use a shell: arguments are passed as a list so a
   * branch name, ref or title can never be interpreted as a command.
   */
  run(command: string, args: string[]): Promise<CliResult>;
}

/**
 * Outcome of a CLI invocation. Failures are values, not exceptions, because a
 * missing client or an expired login is an expected operational state that the
 * Control Plane reports as missing evidence.
 */
export interface CliResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  /** Failure reason, suitable for an evidence string. Never contains a secret. */
  error?: string;
  /** True when the executable itself could not be found. */
  clientMissing?: boolean;
}