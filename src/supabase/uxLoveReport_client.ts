
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dfarxidgkgsndlzjjzjx.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYXJ4aWRna2dzbmRsempqemp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODg3MDcsImV4cCI6MjA3OTU2NDcwN30.s4MiE6tSLXwF1Rebpr9KXUQB31ElRk2nL9bLGeHxB54";

export const uxLoveReportSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
