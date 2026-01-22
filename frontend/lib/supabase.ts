import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://chhryzblsnqjqrrqmwdx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaHJ5emJsc25xanFycnFtd2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MTU3MjUsImV4cCI6MjA1MDk5MTcyNX0.Zeg3BL9jH98AXfjOH4RiNQ_MNSbA5yCAa5xv-6eBMQU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
