import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api';
import { Candidate, User } from '../../types';
import '../style/unified.css';
import ResultsView from './ResultsView';
import logo from '../../svgs/logo.png';

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
  const [title, setTitle] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [isTie, setIsTie] = useState(false);
  const [winner, setWinner] = useState<Candidate>();
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchCandidates = useCallback(async (stage: number) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const [candidatesRes] = await Promise.all([
        api.fetchCandidates(stage),
      ]);
      const fetchedCandidates: Candidate[] = candidatesRes.data;
      setCandidates(fetchedCandidates);
      setHasLoadedOnce(true);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load voting data.';
      if (errorMsg === "No active session found") {
        setIsPolling(true);
      }
      setError(errorMsg);
      setLoading(false);
      console.error("Fetch data failed:", errorMsg, err);
    }
  }, [currentUser.id]);

  const fetchVotingStatus = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      // First get the current session to check the stage
      const sessionRes = await api.getCurrentVotingSession();
      const newStage = Number(sessionRes.data.stage);

      // Update stage if changed
      if (newStage !== currentStage) {
        setCurrentStage(newStage);
        setShowResults(true);
      }

      const statusRes = await api.fetchVotingStatus();
      const status = statusRes.data;

      setTitle(status.title);
      setVotesRemaining(status.votes_remaining);
      setIsTie(status.is_tie);
      setWaitingMessage(status.waiting_message || '');
      await fetchCandidates(currentStage);

      if (!!status.waiting_message) {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }

      if (status.winner) {
        setWinner(status.winner);
        setIsPolling(false);
      }
      setHasLoadedOnce(true);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load voting status.';
      if (errorMsg === "No active session found") {
        setIsPolling(true);
      }
      setError(errorMsg);
      setLoading(false);
      console.error("Fetch voting status failed:", errorMsg, err);
    }
  }, [currentStage, fetchCandidates]);


  const pollVotingStatus = useCallback(async () => {
    try {
      await fetchVotingStatus();

    } catch (err: any) {
      console.error("Failed to check voting status:", err);
    }
  }, [currentStage, fetchCandidates, fetchVotingStatus]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const sessionRes = await api.getCurrentVotingSession();
        const stage = Number(sessionRes.data.stage);
        setCurrentStage(stage);
        await fetchCandidates(stage);
        await fetchVotingStatus();
        setLoading(false);
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Failed to load session.';
        if (errorMsg === "No active session found") {
          setIsPolling(true);
        }
        setError(errorMsg);
        setLoading(false);
        console.error("Session fetch failed:", errorMsg, err);
      }
    };
    loadData();
  }, [fetchCandidates, fetchVotingStatus]);


  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (isPolling) {
      pollInterval = setInterval(pollVotingStatus, 1000); // Check every 3 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling, pollVotingStatus]);

  const submitVote = async () => {
    if (selectedCandidate === null) {
      setError('Please select a candidate to vote.');
      return;
    }

    // In stage 3, only the president can vote
    if (currentStage === 3 && !currentUser.is_president) {
      setError('Only the president can vote in Round 3.');
      return;
    }

    // In stage 3, voting only happens if there's a tie
    if (currentStage === 3 && !isTie) {
      setError('Voting in Round 3 is only allowed when there is a tie.');
      return;
    }

    setError('');
    setMessage('');
    try {
      await api.vote(Number(selectedCandidate), currentStage);
      setMessage('Vote submitted successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSelectedCandidate(null);

      // Fetch candidates and voting status to update the UI
      await fetchVotingStatus();
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

  if (showResults) {
    return <ResultsView currentStage={currentStage-1} setShowResults={setShowResults} />;
  }

  // Splash view for no active session, or only during initial load
  if ((loading && !hasLoadedOnce) || error === 'No active session found') {
    return (
      <div className="user-splash">
        <img src={logo} alt="Foundation Logo" className="user-splash-logo" />
        <h2 className="user-splash-title">
          Fundacion Conchita Rabago de Jimenez Diaz
        </h2>
        <h3 className="user-splash-subtitle">
          Welcome to the voting for the Foundation Rabago 2025!
        </h3>
        <div className="user-splash-description">
          Your participation is vital to ensuring that we celebrate the most deserving contributors to the scientific community.<br /><br />
          <b>{loading && !hasLoadedOnce ? 'The voting session will start shortly.' : 'The voting session will start shortly.'}</b>
        </div>
      </div>
    );
  }

  return (
    <div className="user-container">
      <div className="fcr-title">
        {title}
      </div>

      {waitingMessage && (
        <div className="user-message waiting">
          {waitingMessage}
        </div>
      )}

      {/* Show winner view when winner is available */}
      {winner && (
        <div className="user-winner-card">
          <img
            src={winner.photo}
            alt={`${winner.name}'s photo`}
            className="user-winner-photo"
          />
          <div className="user-winner-name">
            {winner.name}
          </div>
          <div className="user-winner-description">
            {winner.description}
          </div>
          <div className="user-winner-points">
            Total Points: {winner.points}
          </div>
          <div className="user-winner-message">
            Congratulations to the winner! Thank you all for participating.
          </div>
        </div>
      )}

      {/* Show loading message when no candidates are available */}
      {!winner && candidates.length === 0 && !error && !isPolling && (
        <div className="user-message waiting">Loading candidates...</div>
      )}

      {/* Only show candidate list and voting button if winner is not available and
          (we're not in stage 3 or we're in stage 3 with a tie and the user is the president) */}
      {!winner && !isPolling && (currentStage !== 3 || (currentStage === 3 && isTie && currentUser.is_president)) && (
        <>
          <div className="user-grid">
            {candidates.map(candidate => (
              <div
                key={candidate.id}
                className={`user-card ${selectedCandidate === candidate.id ? 'selected' : ''}`}
                onClick={() => setSelectedCandidate(candidate.id)}
              >
                <div className="user-card-content">
                  <img
                    src={candidate.photo}
                    alt={`${candidate.name}'s photo`}
                    className="user-photo"
                  />
                  <div className="user-info">
                    <div className="user-name">{candidate.name}</div>
                    <div className="user-description">"{candidate.description}"</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitVote}
            disabled={selectedCandidate === null || votesRemaining <= 0}
            className="fcr-button fcr-mt-4"
          >
            Continue
          </button>
        </>
      )}

      {message && <div className="user-message success">{message}</div>}
      {error && <div className="user-message error">{error}</div>}
    </div>
  );
}
