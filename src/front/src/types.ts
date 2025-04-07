// src/front/src/types.ts

export type Candidate = {
  id: number;
  name: string;
};

export type User = {
  id: number;
  username: string;
  is_president: boolean;
  is_admin: boolean;
  hashed_password: string;
};

export type Result = {
  candidate_id: number;
  votes: number;
  candidate_name?: string; // Added during frontend processing
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
}; 