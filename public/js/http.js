const inferBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  const { protocol, port } = window.location || {};
  const isHttp = typeof protocol === 'string' && protocol.startsWith('http');
  const isPort3000 = port === '3000';

  return isHttp && isPort3000 ? '' : 'http://localhost:3000';
};

const ensureLeadingSlash = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new Error('API path must be a string starting with "/"');
  }
  return path;
};

const handleJsonResponse = async (response, path) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    const preview = (await response.text()).slice(0, 120);
    throw new Error(`API ${path} returned non-JSON response: ${preview}`);
  }

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error || payload?.message || response.statusText;
    throw new Error(message);
  }

  return payload;
};

export const createApiClient = (baseUrl = inferBaseUrl()) => {
  const buildUrl = (path) => `${baseUrl}${ensureLeadingSlash(path)}`;

  const getJson = async (path) => {
    const response = await fetch(buildUrl(path), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    return handleJsonResponse(response, path);
  };

  const postJson = async (path, body) => {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body ?? {}),
      credentials: 'same-origin',
    });
    return handleJsonResponse(response, path);
  };

  const getArray = async (path) => {
    const payload = await getJson(path);
    if (Array.isArray(payload)) {
      return payload;
    }

    const { data } = payload ?? {};
    if (Array.isArray(data)) {
      return data;
    }

    if (payload && typeof payload === 'object') {
      const arrayLike = Object.values(payload).find(Array.isArray);
      if (Array.isArray(arrayLike)) {
        console.warn(
          `API ${path} returned unexpected shape; falling back to the first array value.`
        );
        return arrayLike;
      }
    }

    throw new Error(`API ${path} didn't return an array`);
  };

  return {
    getJson,
    postJson,
    getArray,
  };
};

export const apiClient = createApiClient();

export const getArray = (path) => apiClient.getArray(path);
