import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api';
import { Candidate, Result, User } from '../../types';
import '../style/user.css';

interface UserViewProps {
  currentUser: User;
}

export default function UserView({ currentUser }: UserViewProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentStage, setCurrentStage] = useState(1);
  const [votesRemaining, setVotesRemaining] = useState(3);
  const [title, setTitle] = useState(``);
  const [isPolling, setIsPolling] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');

  const fetchCandidates = useCallback(async (stage: number) => {
    setError('');
    setMessage('');
    try {
      const [candidatesRes] = await Promise.all([
        api.fetchCandidates(stage),
      ]);
      const fetchedCandidates: Candidate[] = candidatesRes.data;
      setCandidates(fetchedCandidates);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load voting data.';
      setError(errorMsg);
      console.error("Fetch data failed:", errorMsg, err);
    }
  }, [currentUser.id]);

  const checkVotingStatus = useCallback(async () => {
    try {
      const sessionRes = await api.getCurrentVotingSession();
      const newStage = Number(sessionRes.data.stage);
      
      if (newStage !== currentStage) {
        setVotesRemaining(1);
        setCurrentStage(newStage);
        await fetchCandidates(newStage);
        setIsPolling(false);
        setWaitingMessage('');
      }
    } catch (err: any) {
      console.error("Failed to check voting status:", err);
    }
  }, [currentStage, fetchCandidates]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRes = await api.getCurrentVotingSession();
        const stage = sessionRes.data.stage;
        setCurrentStage(Number(stage));
        await fetchCandidates(stage);
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Failed to load session.';
        setError(errorMsg);
        console.error("Session fetch failed:", errorMsg, err);
      }
    };
    loadData();
  }, [fetchCandidates]);

  useEffect(() => {
    if (votesRemaining === 3) {
      setTitle(`Round ${currentStage}. Choose the 1st Winner (3 points) 🏆`);
    } else if (votesRemaining === 2) {
      setTitle(`Round ${currentStage}. Choose the 2nd Winner (2 points).`);
    } else if (votesRemaining === 1) {
      setTitle(`Round ${currentStage}. Choose the 3rd Winner (1 point).`);
    } else if (votesRemaining === 0) {
      setTitle(`Round ${currentStage}. Voting Completed!`);
      setIsPolling(true);
      setWaitingMessage('Waiting for other users to finish voting...');
    }
  }, [votesRemaining, currentStage]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (isPolling) {
      pollInterval = setInterval(checkVotingStatus, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling, checkVotingStatus]);

  const submitVote = async () => {
    if (selectedCandidate === null) {
      setError('Please select a candidate to vote.');
      return;
    }
    setError('');
    setMessage('');
    try {
      await api.vote(Number(selectedCandidate), currentStage);
      setMessage('Vote submitted successfully!');
      setSelectedCandidate(null);
      const newVotesRemaining = votesRemaining - 1;
      setVotesRemaining(newVotesRemaining);
      await fetchCandidates(currentStage);
    } catch (err: any) {
      let errorMsg = 'Failed to submit vote.';
      if (err.response?.data?.detail === "You have already cast all your votes for this stage") {
        errorMsg = "You have already cast all your votes for this stage.";
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      setError(errorMsg);
      console.error("Vote failed:", errorMsg, err);
    }
  };

  return (
    <div className="mobile-container">
      <div className="mobile-round-title">
        {title}
      </div>

      {waitingMessage && (
        <div className="mobile-waiting">
          {waitingMessage}
        </div>
      )}

      {candidates.length === 0 && !error && (
        <p className="mobile-loading">Loading candidates...</p>
      )}

      <div className="mobile-candidate-list">
        {candidates.map(candidate => (
          <div
            key={candidate.id}
            className={`mobile-candidate-card ${
              selectedCandidate === candidate.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedCandidate(candidate.id)}
          >
            <div className="mobile-candidate-name">
              {candidate.name}
            </div>
            <div className="mobile-candidate-description">
              Description or tagline here
            </div>
          </div>
        ))}
      </div>

      <button
        className="mobile-continue-button"
        onClick={submitVote}
        disabled={selectedCandidate === null || votesRemaining <= 0}
      >
        Continue
      </button>

      {message && <p className="mobile-message">{message}</p>}
      {error && <p className="mobile-error">{error}</p>}
    </div>
  );
}