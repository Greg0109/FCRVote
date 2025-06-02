// src/front/src/types.ts

export type Candidate = {
  id: number;
  name: string;
  photo: string;
  description: string;
  points?: number;
};

export type User = {
  id: number;
  username: string;
  is_president: boolean;
  is_admin: boolean;
  hashed_password: string;
};

export interface StageResult {
    candidate_id: number;
    points: number;
    name: string;
    photo: string;
    description: string;
    total_points: number;
}

export interface Result {
    current_stage: number;
    results: StageResult[];
}

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type VotingSession = {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    stage: number;
}