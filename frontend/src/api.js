export async function api(path, options = {}) {
  const { method = 'GET', body, formData = false } = options;
  const token = localStorage.getItem('campusfind_token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !formData) headers['Content-Type'] = 'application/json';
  const response = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : (formData ? body : JSON.stringify(body))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export function imageSrc(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : path;
}

export function formatDate(value) {
  if (!value) return 'Date not provided';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
