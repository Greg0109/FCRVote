import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import * as api from './api';
import { User, TokenResponse } from './types';
import LoginForm from './components/LoginForm'; // Import extracted component
import AdminView from './components/AdminView'; // Import extracted component
import UserView from './components/UserView'; // Import extracted component
import './components/style/label.css';
import './App.css';

// Remove unused imports: Card, CardContent, CardHeader, CardTitle, Input, Label, Checkbox, Candidate, Result

// --- Main App Component ---
export default function VotingApp() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(false); // Manages user fetching state

    // Wrap handleLogout in useCallback as it's a dependency of fetchUser
    const handleLogout = useCallback(() => {
        console.log("Logging out.");
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setError(null);
        setLoadingUser(false); // Reset loading state on logout
    }, []);

    // Fetch user data if token exists, but not already fetched
    const fetchUser = useCallback(async () => {
        // Only fetch if there's a token AND we don't have a user yet.
        if (token && !currentUser) {
            console.log("Attempting to fetch user...");
            setLoadingUser(true); // Indicate user fetching started
            setError(null);
            try {
                const response = await api.fetchCurrentUser();
                console.log("Fetched user data:", response.data);
                setCurrentUser(response.data);
            } catch (err: any) {
                console.error("Failed to fetch user:", err);
                setError('Session expired or invalid. Please log in again.');
                handleLogout(); // Log out if token is invalid
            } finally {
                console.log("Finished fetching user attempt.");
                setLoadingUser(false); // Indicate user fetching finished
            }
        } else {
             console.log("Skipping fetchUser:", { hasToken: !!token, hasCurrentUser: !!currentUser });
        }
        // Removed loadingUser from dependencies, added handleLogout
    }, [token, currentUser, handleLogout]);

    // Effect to trigger fetch when token appears/changes
    useEffect(() => {
        console.log("Token effect triggered. Token:", token);
        if (token) { // Only try to fetch if token exists
            fetchUser();
        }
        // This effect runs when token changes (login/logout) or fetchUser changes (it shouldn't)
    }, [token, fetchUser]);

    // Handle user login
    const handleLogin = async (username: string, password: string) => {
        setError(null);
        // Removed setLoadingUser(true) here.
        try {
            console.log("Attempting login...");
            const response = await api.login(username, password);
            const newToken = response.data.access_token;
            console.log("Login successful, got token.");
            localStorage.setItem('token', newToken);
            setCurrentUser(null); // Clear potential stale user data first
            setToken(newToken);   // Set token, which triggers the useEffect -> fetchUser
        } catch (err: any) {
            console.error("Login failed:", err);
            const errorMsg = err.response?.data?.detail || 'Login failed. Check credentials.';
            setError(errorMsg);
            // No need to set loadingUser false here as it wasn't set true
        }
    };

    // Refined Render Logic
    return (
        <div className="App">
            <header>
                <h1 className="fcr-title">Voting Application</h1>
                {token && (
                    <Button onClick={handleLogout} variant="outline">Logout</Button>
                )}
            </header>

            {/* Render based on auth and loading state */}
            {!token ? (
                // No token: Show Login Form
                <LoginForm onLogin={handleLogin} error={error} />
            ) : loadingUser ? (
                // Token exists, but fetching user: Show Loading
                <div>Loading...</div>
            ) : currentUser ? (
                // Token exists, user fetched: Show Admin or User View
                currentUser.is_admin ? (
                    <AdminView />
                ) : (
                    <UserView currentUser={currentUser} />
                )
            ) : (
                // Token exists, loading finished, but no user (fetch failed?): Show Error or Fallback
                error ? (
                    <p className="text-red-500 p-4 text-center">Error: {error}</p>
                 ) : (
                    <div className="p-4 text-center text-lg font-medium">Failed to load user data.</div>
                 )
            )}
        </div>
    );
}
