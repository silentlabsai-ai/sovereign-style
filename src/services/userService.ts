import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types/index';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches user profile data from Supabase.
 * @param userId The ID of the user to fetch.
 * @returns UserProfile object.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Error fetching user profile: ${error.message}`);
  }

  if (!data) {
    throw new Error(`User profile not found for ID: ${userId}`);
  }

  // Map database response to UserProfile type if necessary
  return data as UserProfile;
}
