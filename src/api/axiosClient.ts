import { createApiClient } from '@/api/createApiClient';

// App-wide client, mounted at the API root. Shares all auth/transform/401
// behaviour with any other clients via createApiClient — see that file.
const axiosClient = createApiClient(import.meta.env.VITE_API_URL);

export default axiosClient;
