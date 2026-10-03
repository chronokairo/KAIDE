// Composition root do Control Plane (ADR-0028/0032):
// - Supabase/PostgreSQL via PostgREST quando NEXT_PUBLIC_SUPABASE_URL (mesmo projeto
//   do resto do app — em produção aponta para chronokairo-prod) + SUPABASE_SERVICE_ROLE_KEY
//   estão definidos. Fallback SUPABASE_URL aceito para pipelines.
// - Sem Supabase: arquivo JSON local real (CONTROL_PLANE_STORE_PATH, default .data/control-plane.json).
// Arquitetura Hexagonal: Infrastructure — escolhe o adapter concreto por ambiente.

import type { CrmPort } from '@/application/ports/crm-port';
import type { JobStorePort } from '@/application/ports/control-plane-store-port';
import { ControlPlaneFileStore } from './control-plane-file-store';
import { ControlPlaneSupabaseStore } from './control-plane-supabase-store';

export type ControlPlaneStore = JobStorePort & CrmPort;

export function createControlPlaneStore(): ControlPlaneStore {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    return new ControlPlaneSupabaseStore(supabaseUrl, serviceKey);
  }
  return new ControlPlaneFileStore(
    process.env.CONTROL_PLANE_STORE_PATH ?? '.data/control-plane.json'
  );
}

let store: ControlPlaneStore | null = null;

/** Singleton por processo — o file store mantém cache em memória. */
export function getControlPlaneStore(): ControlPlaneStore {
  if (!store) {
    store = createControlPlaneStore();
  }
  return store;
}
