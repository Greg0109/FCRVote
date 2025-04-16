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
  const [isTie, setIsTie] = useState(false);
  const [winner, setWinner] = useState<(Candidate & { points: number }) | null>(null);

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

  const checkForTie = useCallback(async (stage: number) => {
    if (stage === 3) {
      try {
        const resultsRes = await api.fetchResults(2); // Check results from stage 2
        const results = resultsRes.data;

        if (results.length >= 2) {
          // Check if there's a tie between first and second place
          const isTieBetweenFirstAndSecond = results[0].points === results[1].points;
          setIsTie(isTieBetweenFirstAndSecond);
        } else {
          setIsTie(false);
        }
      } catch (err: any) {
        console.error("Failed to check for tie:", err);
        setIsTie(false);
      }
    } else {
      setIsTie(false);
    }
  }, []);

  const fetchWinner = useCallback(async () => {
    setError('');
    try {
      const winnerRes = await api.fetchWinner();
      setWinner(winnerRes.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load winner.';
      setError(errorMsg);
      console.error("Winner fetch failed:", errorMsg, err);
    }
  }, []);

  const checkVotingStatus = useCallback(async () => {
    try {
      const sessionRes = await api.getCurrentVotingSession();
      const newStage = Number(sessionRes.data.stage);

      if (newStage !== currentStage) {
        setVotesRemaining(1);
        setCurrentStage(newStage);
        await fetchCandidates(newStage);
        await checkForTie(newStage);
        setIsPolling(false);
        setWaitingMessage('');
      }

      // If we're in stage 3 and there's no tie or the president has voted (votesRemaining === 0),
      // fetch the winner
      if (newStage === 3 && (!isTie || (isTie && currentUser.is_president && votesRemaining === 0))) {
        await fetchWinner();
      }
    } catch (err: any) {
      console.error("Failed to check voting status:", err);
    }
  }, [currentStage, fetchCandidates, checkForTie, isTie, currentUser.is_president, votesRemaining, fetchWinner]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRes = await api.getCurrentVotingSession();
        const stage = Number(sessionRes.data.stage);
        setCurrentStage(stage);
        await fetchCandidates(stage);
        await checkForTie(stage);

        // If we're in stage 3, try to fetch the winner
        if (stage === 3) {
          await fetchWinner();
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Failed to load session.';
        setError(errorMsg);
        console.error("Session fetch failed:", errorMsg, err);
      }
    };
    loadData();
  }, [fetchCandidates, checkForTie, fetchWinner]);

  useEffect(() => {
    // If we have a winner, set appropriate title and clear waiting message
    if (winner) {
      setTitle(`Voting Completed! Winner Announced`);
      setWaitingMessage('');
      setIsPolling(false);
      return;
    }

    if (currentStage === 1) {
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
    } else if (currentStage === 2) {
      if (votesRemaining === 1) {
        setTitle(`Round ${currentStage}. Choose the Winner (1 point).`);
      } else if (votesRemaining === 0) {
        setTitle(`Round ${currentStage}. Voting Completed!`);
        setIsPolling(true);
        setWaitingMessage('Waiting for other users to finish voting...');
      }
    } else if (currentStage === 3) {
      if (isTie) {
        if (currentUser.is_president) {
          if (votesRemaining === 1) {
            setTitle(`Round ${currentStage}. President Tie-Breaker (1 point).`);
          } else if (votesRemaining === 0) {
            setTitle(`Round ${currentStage}. Voting Completed!`);
            setIsPolling(true);
            setWaitingMessage('Waiting for results to be processed...');
          }
        } else {
          setTitle(`Round ${currentStage}. Waiting for President to break the tie.`);
          setWaitingMessage('The president will cast the deciding vote.');
        }
      } else {
        setTitle(`Round ${currentStage}. Calculating final results...`);
        setWaitingMessage('The final results are being calculated.');
      }
    }
  }, [votesRemaining, currentStage, isTie, currentUser.is_president, winner]);

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

      {/* Show winner view when winner is available */}
      {winner && (
        <div className="mobile-winner-container">
          <h2 className="mobile-winner-title">🏆 Winner Announced! 🏆</h2>
          <div className="mobile-winner-card">
            <div className="mobile-winner-name">
              {winner.name}
            </div>
            <div className="mobile-winner-points">
              Total Points: {winner.points}
            </div>
            <div className="mobile-winner-description">
              {winner.description}
            </div>
          </div>
          <div className="mobile-winner-message">
            Congratulations to the winner! Thank you all for participating.
          </div>
        </div>
      )}

      {/* Show loading message when no candidates are available */}
      {!winner && candidates.length === 0 && !error && (
        <p className="mobile-loading">Loading candidates...</p>
      )}

      {/* Only show candidate list and voting button if winner is not available and
          (we're not in stage 3 or we're in stage 3 with a tie and the user is the president) */}
      {!winner && (currentStage !== 3 || (currentStage === 3 && isTie && currentUser.is_president)) && (
        <>
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
        </>
      )}

      {message && <p className="mobile-message">{message}</p>}
      {error && <p className="mobile-error">{error}</p>}
    </div>
  );
}
