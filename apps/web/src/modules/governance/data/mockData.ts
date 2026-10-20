/**
 * Initial mock configuration for the governance dashboard ConfigView.
 *
 * The file was referenced by `dashboard/ConfigView.tsx` (import of
 * `INITIAL_CONFIG`) but was never committed, breaking `tsc --noEmit` and
 * `next build`. Values mirror the defaults used by the view itself.
 */
export interface GovernanceConfig {
  server: {
    bind: string;
    rpc_socket: string;
  };
  agent: {
    max_iterations: number;
    max_repair_cycles: number;
    default_isolation: string;
  };
}

export const INITIAL_CONFIG: GovernanceConfig = {
  server: {
    bind: '127.0.0.1:8787',
    rpc_socket: '/tmp/chronokairo/control-plane.sock',
  },
  agent: {
    max_iterations: 50,
    max_repair_cycles: 5,
    default_isolation: 'local_sandbox',
  },
};
