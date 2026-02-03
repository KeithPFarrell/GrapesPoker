import type {
  Tournament,
  GameConfiguration,
  TournamentSchedule,
  LiveGame,
  LivePlayer,
  Player,
  TournamentPlayer,
  Points,
  PointLevel,
  LivePrize,
  ApiResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ORG_ID = import.meta.env.VITE_ORG_ID;

async function fetchAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
  const queryParams = new URLSearchParams(params);
  const url = `${API_BASE_URL}/${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    const data: ApiResponse<T> = await response.json();
    return data.records || [];
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

export const PokerLeagueAPI = {
  // Get all tournaments for the organization, ordered by active desc, then startDate desc
  async getTournaments(): Promise<Tournament[]> {
    const tournaments = await fetchAPI<Tournament>('tournament', {
      '$filter': `orgId eq '${ORG_ID}'`,
      '$orderby': 'active desc, startDate desc',
    });

    // Additional client-side filter to ensure ONLY tournaments for the correct orgId are returned
    const filtered = tournaments.filter(t => t.orgId === ORG_ID);

    // Log if any tournaments were filtered out (shouldn't happen with correct API filtering)
    if (filtered.length !== tournaments.length) {
      console.warn(`Filtered out ${tournaments.length - filtered.length} tournaments from other organizations`);
    }

    console.log(`Loaded ${filtered.length} tournaments for orgId: ${ORG_ID}`);
    return filtered;
  },

  // Get game configurations
  async getGameConfigurations(): Promise<GameConfiguration[]> {
    return fetchAPI<GameConfiguration>('game_configuration', {
      '$filter': `orgId eq '${ORG_ID}'`,
    });
  },

  // Get tournament schedule
  async getTournamentSchedule(tournamentId: string): Promise<TournamentSchedule[]> {
    // Note: API has typo 'tournamnetId' instead of 'tournamentId'
    const schedules = await fetchAPI<TournamentSchedule>('tournament_schedule', {
      '$filter': `orgId eq '${ORG_ID}' and tournamnetId eq '${tournamentId}'`,
    });

    // Client-side filter as safety measure (API field name has typo)
    const filtered = schedules.filter(s =>
      s.tournamnetId === tournamentId || s.tournamentId === tournamentId
    );

    return filtered;
  },

  // Get live games for a tournament
  async getLiveGames(tournamentId: string): Promise<LiveGame[]> {
    return fetchAPI<LiveGame>('live_game', {
      '$filter': `tournamentId eq '${tournamentId}'`,
      '$orderby': 'gameDate desc',
    });
  },

  // Get live players for a tournament
  async getLivePlayers(tournamentId: string): Promise<LivePlayer[]> {
    return fetchAPI<LivePlayer>('live_players', {
      '$filter': `tournamentId eq '${tournamentId}'`,
    });
  },

  // Get all players
  async getPlayers(): Promise<Player[]> {
    return fetchAPI<Player>('player', {
      '$filter': `orgId eq '${ORG_ID}'`,
      '$orderby': 'lastName asc, firstName asc',
    });
  },

  // Get tournament players
  async getTournamentPlayers(tournamentId: string): Promise<TournamentPlayer[]> {
    return fetchAPI<TournamentPlayer>('tournament_players', {
      '$filter': `tournamentId eq '${tournamentId}'`,
      '$orderby': 'totalPoints desc',
    });
  },

  // Get points structure
  async getPoints(pointsId: string): Promise<Points[]> {
    return fetchAPI<Points>('points', {
      '$filter': `id eq '${pointsId}'`,
    });
  },

  // Get point levels
  async getPointLevels(pointsId: string): Promise<PointLevel[]> {
    return fetchAPI<PointLevel>('point_level', {
      '$filter': `pointsId eq '${pointsId}'`,
      '$orderby': 'levelNum asc',
    });
  },

  // Get live prizes
  async getLivePrizes(tournamentId: string): Promise<LivePrize[]> {
    return fetchAPI<LivePrize>('live_prizes', {
      '$filter': `tournamentId eq '${tournamentId}'`,
    });
  },

  // Get game configuration by ID
  async getGameConfigurationById(configId: string): Promise<GameConfiguration | null> {
    const configs = await fetchAPI<GameConfiguration>('game_configuration', {
      '$filter': `id eq '${configId}'`,
    });
    return configs[0] || null;
  },
};
