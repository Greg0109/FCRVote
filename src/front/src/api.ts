import axios from 'axios';
import { Candidate, User, Result, TokenResponse } from './types';

const API_BASE = 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE,
});

// TODO: Resolve AxiosRequestConfig type issue if needed
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error: any) => {
    return Promise.reject(error);
});

// Auth
export const login = (username: string, password: string) =>
    apiClient.post<TokenResponse>('/token', new URLSearchParams({ username, password }));

// User info
export const fetchCurrentUser = () => apiClient.get<User>('/users/me');

// Admin actions
export const addCandidate = (name: string) => apiClient.post<Candidate>('/admin/add_candidate', { name });
export const addUser = (username: string, password: string, is_president: boolean) => apiClient.post<User>('/admin/add_user', { username, password, is_president });

// Voting actions
export const fetchCandidates = () => apiClient.get<Candidate[]>('/voting/candidates');
export const vote = (candidateId: number, stage: number) => apiClient.post<{ message: string }>(`/voting/vote/${candidateId}/${stage}`);
export const fetchResults = (stage: number) => apiClient.get<Result[]>(`/voting/results/${stage}`);

export default apiClient; 