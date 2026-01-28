import axios from 'axios';

// In development we prefer a relative URL so the CRA dev server proxy (package.json) forwards to the backend.
// In production, set REACT_APP_API_URL to the full backend URL.
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchProfiles = async () => {
  const response = await api.get('/api/profiles');
  return response.data;
};

export const fetchSnapshot = async (period, question, profile) => {
  const response = await api.post('/api/snapshot', {
    period,
    question,
    profile,
  });
  return response.data;
};

export const fetchSimulation = async (period, question, profile) => {
  const response = await api.post('/api/simulate', {
    period,
    question,
    profile,
  });
  return response.data;
};

export default api;
