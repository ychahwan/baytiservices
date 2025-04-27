// src/utils/auth.ts
import { supabase } from './supabase';




function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

export async function fetchUserRole(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to fetch session:', error.message);
    return null;
  }

  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    console.error('Access token not found');
    return null;
  }

  const decoded = parseJwt(accessToken);
  const role = decoded?.user_role ?? null;

  return role;
}
