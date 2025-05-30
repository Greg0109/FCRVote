import axios from 'axios';
import { Candidate, User, Result, TokenResponse, VotingSession } from './types';

const API_BASE = '';

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
export const addCandidate = (name: string, photo: string, description: string) => apiClient.post<Candidate>('/admin/add_candidate', { name, photo, description });
export const fetchCandidatesList = () => apiClient.get<Candidate[]>('/admin/get_candidates');
export const removeCandidate = (candidateId: number) => apiClient.delete(`/admin/remove_candidate/${candidateId}`);
export const addUser = (username: string, password: string, is_president: boolean) => apiClient.post<User>('/admin/add_user', { username, password, is_president });
export const fetchUsers = () => apiClient.get<User[]>('/admin/get_users');
export const removeUser = (userId: number) => apiClient.delete(`/admin/remove_user/${userId}`);

// Voting sessions
export const startVotingSession = () => apiClient.post<{ message: string }>('/voting_sessions/start_session');
export const endVotingSession = () => apiClient.post<{ message: string }>('/voting_sessions/end_session');
export const getCurrentVotingSession = () => apiClient.get<VotingSession>('/voting_sessions/current_session');
export const getAllVotingSessions = () => apiClient.get<VotingSession[]>('/voting_sessions/sessions');
export const deleteVotingSession = (sessionId: number) => apiClient.delete(`/voting_sessions/delete_session/${sessionId}`);

// Voting actions
export const fetchCandidates = (stage: number) => apiClient.get<Candidate[]>(`/voting/candidates/${stage}`);
export const vote = (candidateId: number, stage: number) => apiClient.post<{ message: string }>(`/voting/vote/${candidateId}/${stage}`);
export const fetchVotingStatus = () => apiClient.get<{
  title: string;
  votes_remaining: number;
  is_tie: boolean;
  waiting_message: string | null;
  winner: Candidate | null;
}>(`/voting/voting_status`);

export const fetchResults = (stage: number) => apiClient.get<Result>(`/voting/results/${stage}`);

export default apiClient; 
