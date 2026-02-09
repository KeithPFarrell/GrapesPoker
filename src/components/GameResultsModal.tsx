import { useEffect, useState } from 'react';
import { PokerLeagueAPI } from '../services/api';
import type { TournamentSchedule, GameConfiguration } from '../types/api';

interface GameResultsModalProps {
  schedule: TournamentSchedule;
  tournamentId: string;
  gameConfig: GameConfiguration | null | undefined;
  onClose: () => void;
}

interface GameResult {
  position: number;
  playerName: string;
  points: number;
  prizeMoney: number;
}

export default function GameResultsModal({
  schedule,
  tournamentId,
  gameConfig,
  onClose
}: GameResultsModalProps) {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalPrizePool, setTotalPrizePool] = useState(0);

  useEffect(() => {
    loadGameResults();
  }, [schedule.id, tournamentId]);

  async function loadGameResults() {
    try {
      setLoading(true);

      // Get all live games for this tournament
      const liveGames = await PokerLeagueAPI.getLiveGames(tournamentId);

      // Find the game that matches this schedule
      const game = liveGames.find(g => g.scheduleId === schedule.id);

      if (!game) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Get live players for this specific game
      const [allLivePlayers, allPlayers, livePrizes, tournaments] = await Promise.all([
        PokerLeagueAPI.getLivePlayers(tournamentId),
        PokerLeagueAPI.getPlayers(),
        PokerLeagueAPI.getLivePrizes(tournamentId),
        PokerLeagueAPI.getTournaments(),
      ]);

      // Filter players for this specific game
      const gamePlayers = allLivePlayers.filter(lp => lp.liveGameId === game.id);

      // Get tournament to access pointsId
      const tournament = tournaments.find(t => t.id === tournamentId);
      const pointLevels = tournament?.pointsId
        ? await PokerLeagueAPI.getPointLevels(tournament.pointsId)
        : [];

      // Create point level map
      const pointLevelMap = new Map<number, number>();
      pointLevels.forEach(level => {
        pointLevelMap.set(level.levelNum, level.amount);
      });

      // Create player map
      const playerMap = new Map();
      allPlayers.forEach(p => playerMap.set(p.id, p));

      // Create prize map for this game
      const prizeMap = new Map<string, number>();
      livePrizes
        .filter(prize => prize.liveGameId === game.id)
        .forEach(prize => {
          const key = `${prize.liveGameId}_${prize.place}`;
          prizeMap.set(key, prize.amount);
        });

      // Build results
      const gameResults: GameResult[] = gamePlayers
        .map((gp: any) => {
          const player = playerMap.get(gp.playerId);
          const position = gp.placed;
          const points = position ? pointLevelMap.get(position) || 0 : 0;
          const prizeKey = `${game.id}_${position}`;
          const prizeMoney = prizeMap.get(prizeKey) || 0;

          return {
            position: position || 999,
            playerName: player
              ? `${player.firstName} ${player.lastName}`
              : 'Unknown Player',
            points,
            prizeMoney,
          };
        })
        .filter(r => r.position !== 999)
        .sort((a, b) => a.position - b.position);

      setResults(gameResults);
      setTotalPlayers(game.numOfPlayers || gamePlayers.length);
      setTotalPrizePool(gameResults.reduce((sum, r) => sum + r.prizeMoney, 0));
    } catch (error) {
      console.error('Error loading game results:', error);
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
              {schedule.weekNum ? `Week ${schedule.weekNum}` : 'Game'} Results
            </h2>
            <p className="text-poker-gold text-lg mt-1">
              {gameConfig?.name || 'Game'}
            </p>
            {schedule.date && (
              <p className="text-sm mt-1 text-gray-200">
                {new Date(schedule.date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
                {schedule.time && ` at ${schedule.time}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-poker-gold text-3xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Game Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-poker-green">{totalPlayers}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                £{totalPrizePool.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Prize Pool</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">{results.length}</div>
              <div className="text-sm text-gray-600">Positions Recorded</div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4 text-poker-green">Final Standings</h3>

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading results...</div>
          ) : results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-poker-green text-white">
                    <th className="px-4 py-3 text-left">Position</th>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-right">Points</th>
                    <th className="px-4 py-3 text-right">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    >
                      <td className="px-4 py-3 font-bold">
                        {result.position === 1 && '🥇 '}
                        {result.position === 2 && '🥈 '}
                        {result.position === 3 && '🥉 '}
                        {result.position}
                      </td>
                      <td className="px-4 py-3 font-semibold">{result.playerName}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700">
                        {result.points}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        {result.prizeMoney > 0 ? `£${result.prizeMoney.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No results available for this game yet.
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
