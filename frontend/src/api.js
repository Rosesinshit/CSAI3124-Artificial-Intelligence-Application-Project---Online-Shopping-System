import axios from 'axios';

const SESSION_STORAGE_KEY = 'shopping_session_id';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

export async function trackBehavior(actionType, { productId = null, metadata = {} } = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  try {
    const response = await api.post('/behaviors', {
      product_id: productId,
      action_type: actionType,
      session_id: getSessionId(),
      metadata,
    });
    return response.data.data;
  } catch (error) {
    console.error('Behavior tracking failed:', error);
    return null;
  }
}

export default api;
