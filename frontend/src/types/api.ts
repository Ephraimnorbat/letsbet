export type ApiResponse<T> = T;

export type Wallet = {
  balance: number;
};

export type Match = {
  id: number;
  league?: {
    name: string;
  };
};

export type MatchListResponse = {
  results: Match[];
};