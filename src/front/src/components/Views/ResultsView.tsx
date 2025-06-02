import React, { useState, useEffect } from 'react';
import * as api from '../../api';
import '../style/unified.css';

interface ResultsViewProps {
  currentStage: number;
  setShowResults: (show: boolean) => void;
}

export default function ResultsView({ currentStage, setShowResults }: ResultsViewProps) {
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await api.fetchResults(currentStage);
        setResults(response.data.results);
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Failed to load results.';
        setError(errorMsg);
        console.error("Fetch results failed:", errorMsg, err);
      }
    };
    loadResults();
  }, [currentStage]);

  const handleNextStage = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowResults(false);
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="results-round">
          Round {currentStage} Results
        </div>
        <div className="results-subtitle">
          Here are the results for this round of voting
        </div>
      </div>

      {error && <div className="user-message error">{error}</div>}

      <div className="results-grid">
        {results.map((result, index) => (
          <div key={result.candidate_id} className="results-card">
            <div className="results-card-content">
              <img
                src={result.photo || '/default-photo.png'}
                alt={`${result.name}`}
                className="results-photo"
              />
              <div className="results-info">
                <div className="results-name">
                  {result.name}
                </div>
                <div className="results-description">
                  {result.description}
                </div>
                <div className="results-points">
                  <div className="results-round-points">
                    Round {currentStage} Points: {result.points}
                  </div>
                  <div className="results-total-points">
                    Total Points: {result.total_points}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="results-button">
        <button
          className="fcr-button"
          onClick={handleNextStage}
        >
          Continue to Next Round
        </button>
      </div>
    </div>
  );
} 