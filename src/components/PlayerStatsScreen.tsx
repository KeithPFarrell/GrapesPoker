import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PokerLeagueAPI } from '../services/api';
import type {
  Player,
  Tournament,
  LivePlayer,
  LiveGame,
  TournamentPlayer,
  PlayerStatistics,
  TournamentPlayerStats,
  PlayerGameHistory,
} from '../types/api';

export default function PlayerStatsScreen() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerStatistics(selectedPlayer);
    }
  }, [selectedPlayer]);

  async function loadPlayers() {
    try {
      setLoading(true);
      const data = await PokerLeagueAPI.getPlayers();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayerStatistics(player: Player) {
    try {
      setStatsLoading(true);

      // Load all tournaments
      const tournaments = await PokerLeagueAPI.getTournaments();

      // Load data for each tournament
      const tournamentStatsPromises = tournaments.map(async (tournament) => {
        const [tournamentPlayers, livePlayers, liveGames, schedules] = await Promise.all([
          PokerLeagueAPI.getTournamentPlayers(tournament.id),
          PokerLeagueAPI.getLivePlayers(tournament.id),
          PokerLeagueAPI.getLiveGames(tournament.id),
          PokerLeagueAPI.getTournamentSchedule(tournament.id),
        ]);

        // Find this player in tournament
        const playerInTournament = tournamentPlayers.find(tp => tp.playerId === player.id);
        if (!playerInTournament) return null;

        // Get player's games
        const playerGames = livePlayers.filter(lp => lp.playerId === player.id);

        // Create game map
        const gameMap = new Map<string, LiveGame>();
        liveGames.forEach(game => gameMap.set(game.id, game));

        // Create schedule map for date/week lookup
        const scheduleMap = new Map();
        schedules.forEach(s => {
          scheduleMap.set(s.id, s);
        });

        // Build game history
        const gameHistory: PlayerGameHistory[] = playerGames
          .map((pg: any) => {
            const game = gameMap.get(pg.liveGameId);
            const schedule = game?.scheduleId ? scheduleMap.get(game.scheduleId) : null;

            // API uses 'placed' field for position
            const position = pg.placed;

            return {
              gameDate: schedule?.date || '',
              gameNumber: schedule?.weekNum,
              position: position,
              points: pg.points,
              prizeMoney: pg.prizeMoney,
              knockouts: pg.knockouts,
              bounties: pg.bounties,
            };
          })
          .filter(h => h.gameDate && h.position) // Only include games with valid dates and positions
          .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

        // Calculate stats - use the corrected positions from game history
        const positions = gameHistory.filter(g => g.position).map(g => g.position!);
        const bestPosition = positions.length > 0 ? Math.min(...positions) : 0;

        const stats: TournamentPlayerStats = {
          tournament,
          gamesPlayed: playerInTournament.gamesPlayed || 0,
          totalPoints: playerInTournament.totalPoints || 0,
          totalWinnings: playerInTournament.earnings || 0,           // API uses earnings for prize money
          totalKnockouts: playerInTournament.totalEliminated || 0,   // API uses totalEliminated
          totalBounties: playerInTournament.totalBounties || 0,
          averagePoints: (playerInTournament.gamesPlayed && playerInTournament.totalPoints && playerInTournament.gamesPlayed > 0)
            ? playerInTournament.totalPoints / playerInTournament.gamesPlayed
            : 0,
          bestPosition,
          gameHistory,
        };

        return stats;
      });

      const tournamentDetails = (await Promise.all(tournamentStatsPromises))
        .filter((stats): stats is TournamentPlayerStats => stats !== null);

      // Calculate overall statistics
      const totalGamesPlayed = tournamentDetails.reduce((sum, t) => sum + t.gamesPlayed, 0);
      const totalPoints = tournamentDetails.reduce((sum, t) => sum + t.totalPoints, 0);
      const totalWinnings = tournamentDetails.reduce((sum, t) => sum + t.totalWinnings, 0);
      const totalKnockouts = tournamentDetails.reduce((sum, t) => sum + t.totalKnockouts, 0);
      const totalBounties = tournamentDetails.reduce((sum, t) => sum + t.totalBounties, 0);

      const allPositions = tournamentDetails
        .flatMap(t => t.gameHistory)
        .filter(g => g.position)
        .map(g => g.position!);

      const stats: PlayerStatistics = {
        player,
        totalGamesPlayed,
        totalPoints,
        totalWinnings,
        totalKnockouts,
        totalBounties,
        averagePoints: totalGamesPlayed > 0 ? totalPoints / totalGamesPlayed : 0,
        averagePosition: allPositions.length > 0
          ? allPositions.reduce((sum, p) => sum + p, 0) / allPositions.length
          : 0,
        bestPosition: allPositions.length > 0 ? Math.min(...allPositions) : 0,
        worstPosition: allPositions.length > 0 ? Math.max(...allPositions) : 0,
        tournamentsParticipated: tournamentDetails.length,
        tournamentDetails,
      };

      setPlayerStats(stats);
    } catch (error) {
      console.error('Error loading player statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }

  const filteredPlayers = players.filter(player => {
    const fullName = `${player.firstName} ${player.lastName} ${player.nickname || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-green-dark via-poker-green to-poker-green-light">
      {/* Header */}
      <header className="bg-black bg-opacity-50 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">♠♥♦♣</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-poker-gold">
              Player Statistics
            </h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-poker-gold hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xl p-4">
              <h2 className="text-xl font-bold mb-4 text-poker-green">Select Player</h2>

              {/* Search */}
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-poker-green"
              />

              {/* Player List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center text-gray-600 py-4">Loading players...</div>
                ) : filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedPlayer?.id === player.id
                          ? 'bg-poker-green text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-semibold">
                        {player.firstName} {player.lastName}
                      </div>
                      {player.nickname && (
                        <div className={`text-sm mt-1 ${
                          selectedPlayer?.id === player.id ? 'text-poker-gold' : 'text-gray-600'
                        }`}>
                          "{player.nickname}"
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-600 py-4">No players found</div>
                )}
              </div>
            </div>
          </div>

          {/* Player Statistics */}
          <div className="lg:col-span-2">
            {!selectedPlayer ? (
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">🎰</div>
                <h3 className="text-2xl font-bold text-gray-600">Select a player to view statistics</h3>
              </div>
            ) : statsLoading ? (
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <div className="text-gray-600 text-xl">Loading statistics...</div>
              </div>
            ) : playerStats ? (
              <div className="space-y-6">
                {/* Overall Stats */}
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="text-2xl font-bold mb-4 text-poker-green">
                    Overall Statistics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-poker-green">
                        {playerStats.tournamentsParticipated}
                      </div>
                      <div className="text-sm text-gray-600">Tournaments</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-poker-green">
                        {playerStats.totalGamesPlayed}
                      </div>
                      <div className="text-sm text-gray-600">Games Played</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">
                        {playerStats.totalPoints}
                      </div>
                      <div className="text-sm text-gray-600">Total Points</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        £{playerStats.totalWinnings.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total Winnings</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-poker-red">
                        {playerStats.totalKnockouts}
                      </div>
                      <div className="text-sm text-gray-600">Total Knockouts</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-600">
                        {playerStats.totalBounties}
                      </div>
                      <div className="text-sm text-gray-600">Total Bounties</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">
                        {playerStats.averagePoints.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Points</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {playerStats.bestPosition || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Best Position</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-600">
                        {playerStats.averagePosition > 0 ? playerStats.averagePosition.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Avg Position</div>
                    </div>
                  </div>
                </div>

                {/* Tournament Breakdown */}
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="text-2xl font-bold mb-4 text-poker-green">
                    Tournament Breakdown
                  </h3>
                  <div className="space-y-4">
                    {playerStats.tournamentDetails.map((tourney) => (
                      <div key={tourney.tournament.id} className="border rounded-lg p-4">
                        <h4 className="font-bold text-lg mb-3">{tourney.tournament.name}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Games:</span>
                            <span className="ml-2 font-semibold">{tourney.gamesPlayed}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Points:</span>
                            <span className="ml-2 font-semibold text-blue-700">
                              {tourney.totalPoints}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Winnings:</span>
                            <span className="ml-2 font-semibold text-green-600">
                              £{tourney.totalWinnings.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Best:</span>
                            <span className="ml-2 font-semibold">
                              {tourney.bestPosition || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pb-6">
        <div className="flex justify-center">
          <p className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-md shadow-lg border-l-4 border-purple-400 bg-white animate-pulse">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ✨ Built by Leona - Vibe coding Agent from HCL Software
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
