// API Response Types for Poker League

export interface Tournament {
  id: string;
  orgId: string;
  name: string;
  startDate: string;
  endDate?: string;
  active: number | boolean;
  pointsId: string;
  note?: string;
  numOfWeeks?: number;
  rakeType?: string;
  rakeAmount?: number;
  startTime?: string;
  currency?: string;
  template?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameConfiguration {
  id: string;
  orgId: string;
  name: string;
  entryAmount?: number;
  numOfRebuys?: number;
  rebuyAmount?: number;
  rebuyChips?: number;
  numOfAddOn?: number;
  addOnAmount?: number;
  addOnChips?: number;
  bounty?: number;
  bountryOptional?: number;
  bountyAmount?: number;
  chipStack?: number;
  blindId?: string;
}

export interface TournamentSchedule {
  id: string;
  tournamentId?: string;
  tournamnetId?: string;  // API typo
  orgId: string;
  gameId?: string;
  date?: string;
  time?: string;
  weekNum?: number;
  status?: string;
  gameConfiguration?: GameConfiguration;
}

export interface LiveGame {
  id: string;
  tournamentId: string;
  scheduleId?: string;
  numOfPlayers?: number;
  numOfPrizes?: number;
  totalPot?: number;
  totalChips?: number;
  averageChips?: number;
  playersRemaining?: number;
}

export interface LivePlayer {
  id: string;
  tournamentId: string;
  liveGameId: string;
  playerId: string;
  position?: number;
  points?: number;
  prizeMoney?: number;
  knockouts?: number;
  bounties?: number;
  rebuys?: number;
  addons?: number;
  player?: Player;
}

export interface Player {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status?: string;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  playerId: string;
  totalPoints?: number;
  gamesPlayed?: number;
  totalAmount?: number;        // Winnings field from API
  totalEliminated?: number;    // Knockouts field from API
  totalBounties?: number;
  earnings?: number;
  averagePosition?: number;
  bestPosition?: number;
  player?: Player;
  // Legacy/computed fields for compatibility
  totalWinnings?: number;
  totalKnockouts?: number;
}

export interface Points {
  id: string;
  name: string;
  description?: string;
  orgId: string;
}

export interface PointLevel {
  id: string;
  pointsId: string;
  levelNum: number;
  amount: number;
  orgId: string;
}

export interface LivePrize {
  id: string;
  tournamentId: string;
  liveGameId: string;
  place: number;        // Finishing position (1st, 2nd, 3rd, etc.)
  amount: number;       // Prize amount in currency
  prizeType?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  records: T[];
  opstatus: number;
  httpStatusCode: number;
}

// Leaderboard view types
export type LeaderboardView = 'points' | 'winnings' | 'knockouts' | 'bounties';

// Enhanced types for UI
export interface LeaderboardEntry extends TournamentPlayer {
  rank: number;
  averagePoints: number;
  totalPoints: number;
  gamesPlayed: number;
  totalWinnings: number;
  totalKnockouts: number;
  totalBounties: number;
  player: Player;
}

export interface PlayerGameHistory {
  gameDate: string;
  gameNumber?: number;
  position?: number;
  points?: number;
  prizeMoney?: number;
  knockouts?: number;
  bounties?: number;
}

export interface PlayerStatistics {
  player: Player;
  totalGamesPlayed: number;
  totalPoints: number;
  totalWinnings: number;
  totalKnockouts: number;
  totalBounties: number;
  averagePoints: number;
  averagePosition: number;
  bestPosition: number;
  worstPosition: number;
  tournamentsParticipated: number;
  tournamentDetails: TournamentPlayerStats[];
}

export interface TournamentPlayerStats {
  tournament: Tournament;
  gamesPlayed: number;
  totalPoints: number;
  totalWinnings: number;
  totalKnockouts: number;
  totalBounties: number;
  averagePoints: number;
  bestPosition: number;
  gameHistory: PlayerGameHistory[];
}
