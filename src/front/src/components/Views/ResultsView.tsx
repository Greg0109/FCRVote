import React, { useState, useEffect } from 'react';
import * as api from '../../api';
import { useNavigate } from 'react-router-dom';
import '../style/results.css';

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
      setShowResults(false);
  };

  return (
    <div className="mobile-container">
      <div className="mobile-round-title">
        Round {currentStage} Results
      </div>

      {error && <p className="mobile-error">{error}</p>}

      <div className="mobile-results-list">
        {results.map((result, index) => (
          <div key={result.candidate_id} className="mobile-result-card">
            <div className="mobile-result-content">
              <div className="mobile-result-photo">
                <img
                  src={result.photo || '/default-photo.png'}
                  alt={`${result.name}`}
                  className="mobile-result-photo-img"
                />
              </div>
              <div className="mobile-result-info">
                <div className="mobile-result-name">
                  {result.name}
                </div>
                <div className="mobile-result-description">
                  {result.description}
                </div>
                <div className="mobile-result-points">
                  <div className="mobile-result-stage-points">
                    Round {currentStage} Points: {result.points}
                  </div>
                  <div className="mobile-result-total-points">
                    Total Points: {result.total_points}
                  </div>
                </div>
              </div>
              {index === 0 && (
                <div className="mobile-result-winner-badge">
                  🏆
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        className="mobile-continue-button"
        onClick={handleNextStage}
      >
        Continue to Next Round
      </button>
    </div>
  );
} 