// src/front/src/types.ts

export type Candidate = {
  id: number;
  name: string;
  photo: string;
  description: string;
};

export type User = {
  id: number;
  username: string;
  is_president: boolean;
  is_admin: boolean;
  hashed_password: string;
};

export interface Result {
    candidate_id: number;
    candidate_name: string;
    votes: number;
    user_id: number;
    points: number;
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