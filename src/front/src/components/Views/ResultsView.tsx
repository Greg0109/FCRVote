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
    <div className="fcr-container">
      <div className="fcr-title">
        Round {currentStage} Results
      </div>

      {error && <p className="fcr-error">{error}</p>}

      <div className="fcr-flex-col fcr-gap-4 fcr-mt-4">
        {results.map((result, index) => (
          <div key={result.candidate_id} className="fcr-card-horizontal">
            <img
              src={result.photo || '/default-photo.png'}
              alt={`${result.name}`}
              className="candidate-photo"
            />
            <div className="fcr-flex-col">
              <div className="fcr-title">
                {result.name}
              </div>
              <div className="fcr-description">
                {result.description}
              </div>
              <div className="fcr-flex-col">
                <div className="fcr-label">
                  Round {currentStage} Points: {result.points}
                </div>
                <div className="fcr-description">
                  Total Points: {result.total_points}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="fcr-button fcr-mt-4"
        onClick={handleNextStage}
      >
        Continue to Next Round
      </button>
    </div>
  );
} 