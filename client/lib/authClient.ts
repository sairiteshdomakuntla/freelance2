import { createAuthClient } from 'better-auth/react';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { API_BASE_URL } from '../config';

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  plugins: [phoneNumberClient()],
});

export { API_BASE_URL };
