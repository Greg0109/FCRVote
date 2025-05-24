import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api';
import { Candidate, User } from '../../types';
import '../style/user.css';
import ResultsView from './ResultsView';
import logo from '../../logo.svg';

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
      if (errorMsg === "No active session found") {
        setIsPolling(true);
      }
      setError(errorMsg);
      console.error("Fetch data failed:", errorMsg, err);
    }
  }, [currentUser.id]);

  const fetchVotingStatus = useCallback(async () => {
    setError('');
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

    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load voting status.';
      if (errorMsg === "No active session found") {
        setIsPolling(true);
      }
      setError(errorMsg);
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
      try {
        const sessionRes = await api.getCurrentVotingSession();
        const stage = Number(sessionRes.data.stage);
        setCurrentStage(stage);
        await fetchCandidates(stage);
        await fetchVotingStatus();
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Failed to load session.';
        if (errorMsg === "No active session found") {
          setIsPolling(true);
        }
        setError(errorMsg);
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

  // Splash view for no active session
  if (error === 'No active session found') {
    return (
      <div className="mobile-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
        <img src={logo} alt="Foundation Logo" style={{ width: 180, height: 180, marginBottom: 24, marginTop: 32 }} />
        <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 12 }}>
          Fundacion Conchita Rabago de Jimenez Diaz
        </h2>
        <h3 style={{ fontWeight: 500, fontSize: 18, marginBottom: 24, color: '#333' }}>
          Welcome to the voting for the Foundation Rabago 2025!
        </h3>
        <div style={{ color: '#555', fontSize: 16, marginBottom: 16 }}>
          Your participation is vital to ensuring that we celebrate the most deserving contributors to the scientific community.<br /><br />
          <b>The voting session will start shortly.</b>
        </div>
      </div>
    );
  }

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

      {/* Show winner view when winner is available */}
      {winner && (
        <div className="mobile-winner-container">
          <h2 className="mobile-winner-title">🏆 Winner Announced! 🏆</h2>
          <div className="mobile-winner-card">
            <div className="mobile-winner-photo">
              <img
                src={winner.photo}
                alt={`${winner.name}'s photo`}
                className="mobile-winner-photo-img"
              />
            </div>
            <div className="mobile-winner-name">
              {winner.name}
            </div>
            <div className="mobile-winner-description">
              {winner.description}
            </div>
            <div className="mobile-winner-points">
              Total Points: {winner.points}
            </div>
          </div>
          <div className="mobile-winner-message">
            Congratulations to the winner! Thank you all for participating.
          </div>
        </div>
      )}

      {/* Show loading message when no candidates are available */}
      {!winner && candidates.length === 0 && !error && !isPolling && (
        <p className="mobile-loading">Loading candidates...</p>
      )}

      {/* Only show candidate list and voting button if winner is not available and
          (we're not in stage 3 or we're in stage 3 with a tie and the user is the president) */}
      {!winner && !isPolling && (currentStage !== 3 || (currentStage === 3 && isTie && currentUser.is_president)) && (
        <>
          <div className="mobile-candidate-list">
            {candidates.map(candidate => (
              <div
                key={candidate.id}
                className={`mobile-candidate-card ${
                  selectedCandidate === candidate.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedCandidate(candidate.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedCandidate === candidate.id ? '2px dashed #007aff' : '1px solid #ddd',
                  backgroundColor: selectedCandidate === candidate.id ? '#f0f8ff' : '#fff',
                  marginBottom: '12px',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={candidate.photo}
                  alt={`${candidate.name}'s photo`}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '16px',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                  <div style={{ fontStyle: 'italic', marginTop: '4px', color: '#444' }}>"{candidate.description}"</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitVote}
            disabled={selectedCandidate === null || votesRemaining <= 0}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#000',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '17px',
              borderRadius: '999px',
              marginTop: '16px',
              border: 'none',
              cursor: selectedCandidate === null || votesRemaining <= 0 ? 'not-allowed' : 'pointer',
              opacity: selectedCandidate === null || votesRemaining <= 0 ? 0.6 : 1,
            }}
          >
            Continue
          </button>
        </>
      )}

      {message && <p className="mobile-message">{message}</p>}
      {error && <p className="mobile-error">{error}</p>}
    </div>
  );
}
