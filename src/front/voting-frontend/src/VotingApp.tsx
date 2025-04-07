import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

type Candidate = {
  id: number;
  name: string;
  description: string;
};

const API_BASE = 'http://localhost:8000';

export default function VotingApp() {
  const [stage, setStage] = useState(1);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/results/${stage}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (resultsRes) => {
        const voteResults = await resultsRes.json();
        const candidateIds = voteResults.map((r: any) => r.candidate_id);
        const candidatesRes = await fetch(`${API_BASE}/candidates`);
        const allCandidates = await candidatesRes.json();
        const filtered = allCandidates.filter((c: any) => candidateIds.includes(c.id));
        setCandidates(filtered);
      });
  }, [token]);

  const submitVote = async () => {
    if (!selectedCandidate) return;
    await fetch(`${API_BASE}/voting/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ candidate_id: selectedCandidate }),
    });
    alert('Vote submitted!');
  };

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setToken(data.access_token);
    setRole(data.role);
  };

  const handleTieBreak = async (winnerId: number) => {
    await fetch(`${API_BASE}/voting/tie-break`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ winner_id: winnerId }),
    });
    alert('Tie broken and winner selected.');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Science Prize Voting</h1>
      {!token ? (
        <LoginForm onLogin={login} />
      ) : (
        <div>
          <p className="mb-2">Stage {stage}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidates.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer ${
                  selectedCandidate === c.id ? 'border-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedCandidate(c.id)}
              >
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold">{c.name}</h2>
                  <p>{c.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button className="mt-4" onClick={submitVote}>
            Submit Vote
          </Button>
          {stage === 2 && role === 'president' && (
            <div className="mt-6">
              <h2 className="text-lg font-bold mb-2">Tie Breaker (President Only)</h2>
              {candidates.map((c) => (
                <Button
                  key={c.id}
                  className="m-1"
                  onClick={() => handleTieBreak(c.id)}
                >
                  Select {c.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Username"
        value={username}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
      />
      <Button type="submit">Login</Button>
    </form>
  );
}
