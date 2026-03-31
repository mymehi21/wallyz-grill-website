import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqdycbkywmxetrjlyoyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZHljYmt5d214ZXRyamx5b3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTk4OTMsImV4cCI6MjA3NzA3NTg5M30.fOLyZxN6xH1WuVaEPqooqGKYt5I9zQ3Lz6-qL3gJTcs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
