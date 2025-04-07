import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Checkbox } from './components/ui/checkbox';
import * as api from './api'; // Import API functions

// --- Types ---
type Candidate = {
  id: number;
  name: string;
  // Removed description as it's not in backend schema CandidateOut
};

// Define User type directly based on backend UserOut schema
type User = {
  id: number;
  username: string;
  is_president: boolean;
};

type Result = {
    candidate_id: number;
    votes: number;
    // Add name for display purposes
    candidate_name?: string;
}

// Type for the /token endpoint response
type TokenResponse = {
    access_token: string;
    token_type: string;
}

// --- Main App Component ---
export default function VotingApp() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);

  const fetchUser = useCallback(async () => {
      if (token && !currentUser) {
          setLoadingUser(true);
          setError(null);
          try {
              // Rely on inference + later casting if needed
              const response = await api.fetchCurrentUser();
              setCurrentUser(response.data as User); // Add assertion
              console.log("Fetched user:", response.data);
          } catch (err: any) {
              console.error("Failed to fetch user:", err);
              setError('Failed to fetch user details. Please try logging in again.');
              handleLogout(); // Log out if token is invalid
          } finally {
              setLoadingUser(false);
          }
      }
  }, [token, currentUser]);

  useEffect(() => {
    fetchUser();
  }, [token, fetchUser]); // Updated dependencies


  const handleLogin = async (username: string, password: string) => {
    setError(null);
    try {
      // Rely on inference + later casting if needed
      const response = await api.login(username, password);
      const newToken = (response.data as TokenResponse).access_token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(null); // Reset user before fetching new one
      // Fetch user will be triggered by useEffect due to token change
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMsg = err.response?.data?.detail || 'Login failed. Check credentials.';
      setError(errorMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setError(null);
  };

  if (loadingUser) {
      return <div className="p-4 text-center">Loading user data...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-3xl font-bold">Voting Application</h1>
        {token && (
            <Button onClick={handleLogout} variant="outline">Logout</Button>
        )}
      </header>

      {error && <p className="text-red-500 mb-4">Error: {error}</p>}

      {!token ? (
        <LoginForm onLogin={handleLogin} />
      ) : currentUser ? (
        currentUser.is_president ? (
          <AdminView />
        ) : (
          <UserView currentUser={currentUser} />
        )
      ) : (
        // This state should be brief while user is being fetched
        <p>Loading...</p>
      )}
    </div>
  );
}

// --- Login Form Component (Simplified for Diagnosis) ---
function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <Card>
        <CardContent className="pt-6">
             <h2 className="text-xl font-semibold mb-4">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Username</label>
                    <Input
                        id="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit">Login</Button>
            </form>
        </CardContent>
    </Card>
  );
}

// --- Admin View Component (Simplified for Diagnosis) ---
function AdminView() {
    const [candidateName, setCandidateName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isPresident, setIsPresident] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.addCandidate(candidateName);
            setMessage(`Candidate "${candidateName}" added successfully.`);
            setCandidateName('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to add candidate.');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.addUser(newUsername, newPassword, isPresident);
            setMessage(`User "${newUsername}" added successfully.`);
            setNewUsername('');
            setNewPassword('');
            setIsPresident(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to add user.');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Admin Panel</h2>
            {message && <p className="text-green-600">{message}</p>}
            {error && <p className="text-red-600">Error: {error}</p>}

            {/* Add Candidate Form - Simplified */}
            <Card>
                <CardContent className="pt-6">
                     <h3 className="text-lg font-semibold mb-4">Add Candidate</h3>
                    <form onSubmit={handleAddCandidate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="candidateName">Candidate Name</label>
                            <Input
                                id="candidateName"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                                placeholder="Enter candidate name"
                                required
                            />
                        </div>
                        <Button type="submit">Add Candidate</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Add User Form - Simplified */}
            <Card>
                 <CardContent className="pt-6">
                     <h3 className="text-lg font-semibold mb-4">Add User</h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newUsername">Username</label>
                            <Input
                                id="newUsername"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">Password</label>
                             <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                        </div>
                         <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isPresidentAdmin"
                                checked={isPresident}
                                onChange={(e) => setIsPresident(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                             <label htmlFor="isPresidentAdmin" className="ml-2 block text-sm text-gray-900">Is President (Admin)</label>
                        </div>
                        <Button type="submit">Add User</Button>
                    </form>
                 </CardContent>
            </Card>
        </div>
    );
}


// --- User View Component ---
function UserView({ currentUser }: { currentUser: User }) {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [results, setResults] = useState<Result[] | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const VOTE_STAGE = 1; // Hardcode stage 1 for simplicity

    const fetchCandidatesAndResults = useCallback(async () => {
        setError('');
        setMessage('');
        try {
             // Use explicit casting here
            const [candidatesRes, resultsRes] = await Promise.all([
                api.fetchCandidates(), // Keep as is
                api.fetchResults(VOTE_STAGE) // Keep as is
            ]);

            // Assert types on accessing .data
            const fetchedCandidates: Candidate[] = candidatesRes.data as Candidate[];
            const fetchedResultsData: Omit<Result, 'candidate_name'>[] = resultsRes.data as Omit<Result, 'candidate_name'>[];

            const candidateMap = new Map(fetchedCandidates.map(c => [c.id, c.name]));

            const resultsWithNames = fetchedResultsData.map(r => ({
                ...r,
                candidate_name: candidateMap.get(r.candidate_id) || 'Unknown Candidate'
            }));

            setCandidates(fetchedCandidates);
            setResults(resultsWithNames);
            console.log("Fetched Candidates:", fetchedCandidates);
            console.log("Fetched Results:", resultsWithNames);

        } catch (err: any) {
            console.error("Failed to fetch data:", err);
            setError(err.response?.data?.detail || 'Failed to load candidates or results.');
        }
    }, []);

    useEffect(() => {
        fetchCandidatesAndResults();
    }, [fetchCandidatesAndResults]);

    const submitVote = async () => {
        if (selectedCandidate === null) {
            setError('Please select a candidate to vote.');
            return;
        }
        setError('');
        setMessage('');
        try {
            await api.vote(selectedCandidate, VOTE_STAGE);
            setMessage('Vote submitted successfully!');
            setSelectedCandidate(null); // Reset selection
            // Optionally re-fetch results after voting
            await fetchCandidatesAndResults();
        } catch (err: any) {
            console.error("Vote failed:", err);
             // Check for specific "already voted" error
            if (err.response?.data?.detail === "Already voted in this stage") {
                setError("You have already voted in this stage.");
            } else {
                setError(err.response?.data?.detail || 'Failed to submit vote.');
            }
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Welcome, {currentUser.username}!</h2>
             {message && <p className="text-green-600">{message}</p>}
             {error && <p className="text-red-600">Error: {error}</p>}

            {/* Voting Section */}
            <Card>
                <CardHeader><CardTitle>Vote - Stage {VOTE_STAGE}</CardTitle></CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">Select a candidate below and click 'Submit Vote'.</p>
                    {candidates.length === 0 && <p>Loading candidates...</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {candidates.map((c) => (
                            <Card
                                key={c.id}
                                className={`cursor-pointer hover:border-blue-500 ${selectedCandidate === c.id ? 'border-2 border-blue-500' : ''}`}
                                onClick={() => setSelectedCandidate(c.id)}
                            >
                                <CardContent className="p-4">
                                    <h3 className="text-lg font-semibold">{c.name}</h3>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                     <Button onClick={submitVote} disabled={selectedCandidate === null}>
                        Submit Vote
                    </Button>
                </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
                <CardHeader><CardTitle>Results - Stage {VOTE_STAGE}</CardTitle></CardHeader>
                <CardContent>
                    {results === null && <p>Loading results...</p>}
                    {results && results.length === 0 && <p>No votes have been cast yet.</p>}
                    {results && results.length > 0 && (
                        <ul className="space-y-2">
                            {results.map((r) => (
                                <li key={r.candidate_id} className="flex justify-between items-center p-2 border rounded">
                                    <span>{r.candidate_name}</span>
                                    <span className="font-semibold">{r.votes} vote(s)</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
