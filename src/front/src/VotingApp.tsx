import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import * as api from './api';
import { User, TokenResponse } from './types';
import LoginForm from './components/LoginForm'; // Import extracted component
import AdminView from './components/AdminView'; // Import extracted component
import UserView from './components/UserView'; // Import extracted component

// Remove unused imports: Card, CardContent, CardHeader, CardTitle, Input, Label, Checkbox, Candidate, Result

// --- Main App Component ---
export default function VotingApp() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(false);

    // Fetch user data if token exists
    const fetchUser = useCallback(async () => {
        if (token && !currentUser && !loadingUser) { // Prevent multiple fetches
            setLoadingUser(true);
            setError(null);
            try {
                const response = await api.fetchCurrentUser();
                setCurrentUser(response.data);
                console.log("Fetched user:", response.data);
            } catch (err: any) {
                console.error("Failed to fetch user:", err);
                setError('Session expired or invalid. Please log in again.');
                handleLogout(); // Log out if token is invalid
            } finally {
                setLoadingUser(false);
            }
        }
    }, [token, currentUser, loadingUser]); // Add loadingUser dependency

    useEffect(() => {
        fetchUser();
    }, [token, fetchUser]);

    // Handle user login
    const handleLogin = async (username: string, password: string) => {
        setError(null);
        setLoadingUser(true); // Show loading state during login
        try {
            const response = await api.login(username, password);
            const newToken = response.data.access_token;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setCurrentUser(null); // Reset user, fetchUser effect will trigger
            // fetchUser will be called by useEffect due to token change
        } catch (err: any) {
            console.error("Login failed:", err);
            const errorMsg = err.response?.data?.detail || 'Login failed. Check credentials.';
            setError(errorMsg);
            setLoadingUser(false); // Stop loading on error
        }
        // setLoadingUser(false) will be handled by fetchUser's finally block on success
    };

    // Handle user logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setError(null);
        setLoadingUser(false); // Ensure loading state is reset
    };

    // Display loading indicator
    if (loadingUser && !currentUser) { // Show loading only when initially fetching user or logging in
        return <div className="p-4 text-center text-lg font-medium">Loading...</div>;
    }

    // Main render logic
    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans">
            <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Voting Application</h1>
                {token && (
                    <Button onClick={handleLogout} variant="outline">Logout</Button>
                )}
            </header>

            {/* Render appropriate view based on auth state */}
            {!token ? (
                // Pass error state to LoginForm
                <LoginForm onLogin={handleLogin} error={error} />
            ) : currentUser ? (
                // Clear app-level error once logged in (component errors handled internally)
                error && setError(null),
                currentUser.is_president ? (
                    <AdminView />
                ) : (
                    <UserView currentUser={currentUser} />
                )
            ) : (
                // This state is usually covered by the loadingUser check above,
                // but serves as a fallback.
                <div className="p-4 text-center text-lg font-medium">Initializing...</div>
            )}
        </div>
    );
}

// --- Removed LoginForm Component --- 

// --- Removed AdminView Component --- 

// --- Removed UserView Component --- 
