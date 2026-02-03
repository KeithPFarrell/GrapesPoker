import { useEffect, useState } from 'react';
import { PokerLeagueAPI } from '../services/api';
import type { LeaderboardEntry, LiveGame, PlayerGameHistory, TournamentSchedule } from '../types/api';

interface PlayerDetailModalProps {
  player: LeaderboardEntry;
  tournamentId: string;
  onClose: () => void;
}

export default function PlayerDetailModal({ player, tournamentId, onClose }: PlayerDetailModalProps) {
  const [gameHistory, setGameHistory] = useState<PlayerGameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerHistory();
  }, [player.playerId, tournamentId]);

  async function loadPlayerHistory() {
    try {
      setLoading(true);

      // Fetch all required data
      const [tournaments, livePlayers, liveGames, schedules, livePrizes] = await Promise.all([
        PokerLeagueAPI.getTournaments(),
        PokerLeagueAPI.getLivePlayers(tournamentId),
        PokerLeagueAPI.getLiveGames(tournamentId),
        PokerLeagueAPI.getTournamentSchedule(tournamentId),
        PokerLeagueAPI.getLivePrizes(tournamentId),
      ]);

      // Find the current tournament to get pointsId
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Fetch point levels for this tournament
      const pointLevels = tournament.pointsId
        ? await PokerLeagueAPI.getPointLevels(tournament.pointsId)
        : [];

      // Create point level map (position -> points)
      const pointLevelMap = new Map<number, number>();
      pointLevels.forEach(level => {
        pointLevelMap.set(level.levelNum, level.amount);
      });

      // Filter for this player's games
      const playerGames = livePlayers.filter(lp => lp.playerId === player.playerId);

      // Create game map for easy lookup
      const gameMap = new Map<string, LiveGame>();
      liveGames.forEach(game => {
        gameMap.set(game.id, game);
      });

      // Create schedule map for date/week lookup
      const scheduleMap = new Map<string, TournamentSchedule>();
      schedules.forEach(s => {
        scheduleMap.set(s.id, s);
      });

      // Create prize map (liveGameId + place -> prize amount)
      // Note: Prize records have 'place' field indicating finishing position, not playerId
      const prizeMap = new Map<string, number>();
      livePrizes.forEach(prize => {
        const key = `${prize.liveGameId}_${prize.place}`;
        prizeMap.set(key, prize.amount);
      });

      // Build history
      const history: PlayerGameHistory[] = playerGames
        .map((pg: any) => {
          const game = gameMap.get(pg.liveGameId);
          const schedule = game?.scheduleId ? scheduleMap.get(game.scheduleId) : null;

          // Get player's finishing position (API uses 'placed' field)
          const position = pg.placed;

          // Calculate points based on position and point levels
          const calculatedPoints = position ? pointLevelMap.get(position) || 0 : 0;

          // Get prize money from live_prizes by matching liveGameId + place
          const prizeKey = `${pg.liveGameId}_${position}`;
          const prizeMoney = prizeMap.get(prizeKey);

          return {
            gameDate: schedule?.date || '',
            gameNumber: schedule?.weekNum,
            position: position,
            points: calculatedPoints,  // Use calculated points from point_level
            prizeMoney: prizeMoney,     // Use prize from live_prizes
          };
        })
        .filter(h => h.gameDate) // Only include games with valid dates
        .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

      setGameHistory(history);
    } catch (error) {
      console.error('Error loading player history:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-poker-green text-white p-6 rounded-t-lg flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">
              {player.player.firstName} {player.player.lastName}
            </h2>
            {player.player.nickname && (
              <p className="text-poker-gold text-lg">"{player.player.nickname}"</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-poker-gold text-3xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Stats Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-poker-green">{player.gamesPlayed}</div>
              <div className="text-sm text-gray-600">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">{player.totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                £{player.totalWinnings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Winnings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-poker-red">{player.totalKnockouts}</div>
              <div className="text-sm text-gray-600">Knockouts</div>
            </div>
          </div>
        </div>

        {/* Game History */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4 text-poker-green">Game History</h3>

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading game history...</div>
          ) : gameHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-poker-green text-white">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Game #</th>
                    <th className="px-4 py-3 text-center">Position</th>
                    <th className="px-4 py-3 text-right">Points</th>
                    <th className="px-4 py-3 text-right">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map((game, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="px-4 py-3">
                        {new Date(game.gameDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">{game.gameNumber || '-'}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {game.position === 1 && '🥇 '}
                        {game.position === 2 && '🥈 '}
                        {game.position === 3 && '🥉 '}
                        {game.position || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700">
                        {game.points || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        {game.prizeMoney ? `£${game.prizeMoney.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No game history available for this player.
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="p-6 bg-gray-50 rounded-b-lg border-t">
          <button
            onClick={onClose}
            className="w-full bg-poker-green hover:bg-poker-green-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
