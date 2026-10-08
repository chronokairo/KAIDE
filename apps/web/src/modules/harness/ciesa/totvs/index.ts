export {
  MATRICULA_TOOL_DEFS,
  MATRICULA_TOOL_NAMES,
  executeMatriculaTool,
} from './tools';
export {
  totvsRestRequest,
  buscarOfertas,
} from './rest-client';
export type { OfertaTotvs } from './rest-client';
export {
  makeSoapRequest,
  parseSoapResponse,
  consultarPessoaPorCPF,
  cadastrarPessoa,
  realizarInscricao,
} from './soap-client';
export type { PessoaTotvs, DadosPessoa, DadosInscricao } from './soap-client';
export {
  TOTVS_BASE_URL,
  TOTVS_AUTH,
  TOTVS_TIMEOUT,
  SOAP_CONFIG,
  SOAP_ENDPOINT,
  buildTotvsRestUrl,
  getTotvsAuthHeaders,
  getContexto,
  fetchWithTimeout,
} from './config';
