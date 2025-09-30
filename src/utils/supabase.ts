import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uauxgbkxqjbpuhkcnlpk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdXhnYmt4cWpicHVoa2NubHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMjk4ODUsImV4cCI6MjA3NDcwNTg4NX0.HXO9piEy9LJt0uNc9bKkJeqYHF89IbFEclCaI627MKk';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

// Export a single, stable client instance.
// The user's session will be managed internally by the Supabase client
// after a successful `signInWithIdToken` call in the AuthContext.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
