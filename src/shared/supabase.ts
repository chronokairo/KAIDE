// Supabase Client with safe local offline fallback for ChronoKairo Desktop

const mockSupabaseQuery = () => {
  const chainable: any = {
    select: () => chainable,
    insert: () => chainable,
    update: () => chainable,
    delete: () => chainable,
    eq: () => chainable,
    neq: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return chainable;
};

export const supabase: any = {
  from: () => mockSupabaseQuery(),
  rpc: async () => ({ data: null, error: null }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: { id: 'local-user', email: 'dev@chronokairo.local' } }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};

export async function getAuthSession() {
  return {
    access_token: 'local-desktop-token',
    user: {
      id: 'local-user',
      email: 'dev@chronokairo.local',
      user_metadata: { name: 'ChronoKairo Developer' },
    },
  };
}
