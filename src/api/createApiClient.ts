import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { camelToSnakeCase } from '@/utils/camelToSnakeCase';
import { snakeToCamelCase } from '@/utils/snakeToCamelCase';
import { saveReturnUrl } from '@/utils/returnUrl';
import { session } from '@/features/auth/session';

// Shared factory for the app's axios clients (ported from bee-compliance).
// Every client gets identical auth, camel/snake transform, FormData and
// single-flight 401 handling; only the baseURL differs. Keeping this in one
// place means an auth/transform fix lands in every client.
export const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  // Set once we begin redirecting to /login on a 401 so a burst of failing
  // requests can't each fire window.location and loop the page.
  let isRedirecting = false;

  client.interceptors.request.use(
    (config) => {
      // Read fresh on each request (another tab may have signed in/out).
      const token = session.token();

      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Transform request data camelCase → snake_case. FormData (uploads) is
      // sent as-is, and loses the JSON Content-Type so the browser sets the
      // multipart boundary.
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      } else if (config.data) {
        config.data = camelToSnakeCase(config.data);
      }

      if (config.params) {
        config.params = camelToSnakeCase(config.params);
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => {
      // Blob responses (file downloads) are left alone.
      if (response.config.responseType !== 'blob' && response.data) {
        response.data = snakeToCamelCase(response.data);
      }
      return response;
    },
    (error) => {
      // Only a signed-in request can be "unauthorised"; a 401 with no token is
      // just an anonymous call and must not bounce the auth pages.
      if (error.response?.status === 401 && session.token()) {
        session.clear();

        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'unauthorized' } }));

        // Single-flight: a burst of 401s must trigger at most ONE navigation.
        if (!isRedirecting && window.location.pathname !== '/login') {
          isRedirecting = true;
          // Remember the page the 401 interrupted so login can return there.
          saveReturnUrl();
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};
