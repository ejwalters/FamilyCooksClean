import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewkdxdmdphpdzrhqmqgo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3a2R4ZG1kcGhwZHpyaHFtcWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjgyMTcsImV4cCI6MjA2NjkwNDIxN30.N49V_CJThJm0k0jwzlWGcfpQFNUJYUw0kaCbNKQzbp0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);