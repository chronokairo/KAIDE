/**
 * storeFactory — retorna o SourceStore certo baseado no ambiente.
 *
 * - Se POSTGRES_HOST estiver definido: tenta PostgreSQL (SourceStore)
 * - Caso contrário: usa arquivo JSON local (JsonSourceStore)
 *
 * O JsonSourceStore salva em <cwd>/.anna-data/sources.json e funciona
 * completamente sem banco de dados — ideal para desenvolvimento local.
 */

import { SourceStore } from './store';
import { JsonSourceStore } from './json-store';

export type AnySourceStore = SourceStore | JsonSourceStore;

let _store: AnySourceStore | null = null;

export function getSourceStore(): AnySourceStore {
  if (_store) return _store;

  if (process.env.POSTGRES_HOST) {
    _store = new SourceStore();
  } else {
    _store = new JsonSourceStore();
  }

  return _store;
}
