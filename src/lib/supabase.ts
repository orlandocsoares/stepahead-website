import { createClient } from '@supabase/supabase-js';

// Vai buscar as chaves que acabaste de configurar
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cria a ligação oficial
export const supabase = createClient(supabaseUrl, supabaseKey);