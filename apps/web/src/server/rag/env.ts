/**
 * Carrega variáveis de ambiente ANTES de qualquer outro módulo
 * Este arquivo deve ser importado primeiro em main.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
const result = config({ path: envPath });
// .env.local complementa/sobrescreve (ex.: SUPABASE_SERVICE_ROLE_KEY do Next).
config({ path: resolve(process.cwd(), '.env.local'), override: true });

if (result.error) {
    console.log('⚠️  .env não encontrado em:', envPath, '- usando variáveis de ambiente do sistema');
} else {
    console.log('✅ .env carregado de:', envPath);
    console.log('   PORT:', process.env.PORT || 'não definido');
}
