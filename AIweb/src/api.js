// Empty in development (Vite proxies /api to the backend).
// For a deployed frontend, set VITE_API_URL to the backend address, e.g. https://my-backend.onrender.com
const API_URL = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'aiweb.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked (private mode) - user just won't stay signed in after reload
  }
}

/** Thrown when the token is missing or expired, so the app can send the user back to sign-in. */
export class AuthError extends Error {}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the server. Is the backend (AIAPI) running?');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  // No JSON from a 5xx means the request never reached our backend (e.g. it's restarting)
  if (!data && response.status >= 500) {
    throw new Error('Cannot reach the server right now. Please try again in a moment.');
  }
  if (response.status === 401 && token) {
    setToken(null);
    throw new AuthError('Your session has expired. Please sign in again.');
  }
  if (!response.ok) {
    throw new Error(data?.error ?? `Something went wrong (error ${response.status}).`);
  }
  return data;
}

function postJson(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const register = (name, email, password) => postJson('/api/auth/register', { name, email, password });
export const login = (email, password) => postJson('/api/auth/login', { email, password });
export const fetchMe = () => request('/api/auth/me');
export const changePassword = (currentPassword, newPassword) =>
  postJson('/api/auth/change-password', { currentPassword, newPassword });
export const forgotPassword = (email) => postJson('/api/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => postJson('/api/auth/reset-password', { token, newPassword });
export const fetchHistory = () => request('/api/analyses');
export const fetchAnalysis = (id) => request(`/api/analyses/${id}`);

function sendJson(method, path, body) {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function formData(fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') form.append(key, value);
  });
  return form;
}

// --- Cover letters ---
export const generateCoverLetter = (fields) =>
  request('/api/cover-letters', { method: 'POST', body: formData(fields) });
export const fetchCoverLetters = () => request('/api/cover-letters');
export const updateCoverLetter = (id, subject, content) => sendJson('PUT', `/api/cover-letters/${id}`, { subject, content });
export const deleteCoverLetter = (id) => request(`/api/cover-letters/${id}`, { method: 'DELETE' });

// --- Interview prep ---
export const generateInterviewPrep = (fields) =>
  request('/api/interview-prep', { method: 'POST', body: formData(fields) });
export const fetchInterviewPreps = () => request('/api/interview-prep');
export const fetchInterviewPrep = (id) => request(`/api/interview-prep/${id}`);
export const deleteInterviewPrep = (id) => request(`/api/interview-prep/${id}`, { method: 'DELETE' });

// --- Job tracker ---
export const fetchApplications = () => request('/api/applications');
export const createApplication = (data) => sendJson('POST', '/api/applications', data);
export const updateApplication = (id, data) => sendJson('PUT', `/api/applications/${id}`, data);
export const deleteApplication = (id) => request(`/api/applications/${id}`, { method: 'DELETE' });

// --- Resume builder ---
export const fetchResumeDraft = () => request('/api/resume-builder');
export const saveResumeDraft = (data) => sendJson('PUT', '/api/resume-builder', { data });

export function analyzeResume(resumeFile, jobDescription) {
  const form = new FormData();
  form.append('resume', resumeFile);
  form.append('jobDescription', jobDescription);
  return request('/api/analyze', { method: 'POST', body: form });
}
