import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import * as api from '../../api'; // Adjust path
import { Candidate, Result, User } from '../../types'; // Adjust path

interface UserViewProps {
    currentUser: User;
}

export default function UserView({ currentUser }: UserViewProps) {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [results, setResults] = useState<Result[] | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const VOTE_STAGE = 1; // Hardcoded for simplicity

    const fetchCandidatesAndResults = useCallback(async () => {
        setError('');
        setMessage('');
        try {
            const [candidatesRes, resultsRes] = await Promise.all([
                api.fetchCandidates(),
                api.fetchResults(VOTE_STAGE)
            ]);

            const fetchedCandidates: Candidate[] = candidatesRes.data;
            const fetchedResultsData: Omit<Result, 'candidate_name'>[] = resultsRes.data;

            const candidateMap = new Map(fetchedCandidates.map(c => [c.id, c.name]));
            const resultsWithNames: Result[] = fetchedResultsData.map(r => ({
                ...r,
                candidate_name: candidateMap.get(r.candidate_id) || 'Unknown Candidate'
            }));

            setCandidates(fetchedCandidates);
            setResults(resultsWithNames);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to load voting data.';
            setError(errorMsg);
            console.error("Fetch data failed:", errorMsg, err);
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
            // Re-fetch results after voting to show update
            await fetchCandidatesAndResults();
        } catch (err: any) {
            let errorMsg = 'Failed to submit vote.';
            if (err.response?.data?.detail === "Already voted in this stage") {
                errorMsg = "You have already voted in this stage.";
            } else if (err.response?.data?.detail) {
                errorMsg = err.response.data.detail;
            }
            setError(errorMsg);
            console.error("Vote failed:", errorMsg, err);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center">Welcome, {currentUser.username}!</h2>

            {/* Display messages/errors */}
            {message && <p className="text-green-600 p-3 bg-green-100 border border-green-300 rounded text-center">{message}</p>}
            {error && <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded text-center">Error: {error}</p>}

            {/* Voting Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Vote - Stage {VOTE_STAGE}</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">Select a candidate below and click 'Submit Vote'.</p>
                </CardHeader>
                <CardContent>
                    {candidates.length === 0 && !error && <p>Loading candidates...</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {candidates.map((candidate) => (
                            <Card
                                key={candidate.id}
                                className={`cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md hover:border-indigo-500 ${selectedCandidate === candidate.id ? 'border-2 border-indigo-600 shadow-lg' : 'border'}`}
                                onClick={() => setSelectedCandidate(candidate.id)}
                            >
                                <CardContent className="p-4 flex items-center justify-center">
                                    <h3 className="text-lg font-medium">{candidate.name}</h3>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Button
                        onClick={submitVote}
                        disabled={selectedCandidate === null}
                        className="w-full sm:w-auto"
                    >
                        Submit Vote
                    </Button>
                </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Results - Stage {VOTE_STAGE}</CardTitle>
                </CardHeader>
                <CardContent>
                    {results === null && !error && <p>Loading results...</p>}
                    {results && results.length === 0 && <p className="text-muted-foreground">No votes have been cast yet.</p>}
                    {results && results.length > 0 && (
                        <ul className="space-y-3">
                            {results.sort((a, b) => b.votes - a.votes).map((result) => (
                                <li key={result.candidate_id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-md">
                                    <span className="font-medium">{result.candidate_name}</span>
                                    <span className="font-semibold text-indigo-600">{result.votes} vote(s)</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 