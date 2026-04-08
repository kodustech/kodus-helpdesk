import axios from 'axios';

const API_URL = process.env.WEB_HOSTNAME_API || 'http://localhost:3003';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Client-side API (uses NEXT_PUBLIC env)
const CLIENT_API_URL =
    typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003')
        : API_URL;

export const clientApi = axios.create({
    baseURL: `${CLIENT_API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
});
