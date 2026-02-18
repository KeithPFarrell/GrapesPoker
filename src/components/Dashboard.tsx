import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PokerLeagueAPI } from '../services/api';
import type {
  Tournament,
  TournamentSchedule,
  GameConfiguration,
  PointLevel,
} from '../types/api';
import Leaderboard from './Leaderboard';
import TournamentChart from './TournamentChart';
import TournamentScheduleTable from './TournamentScheduleTable';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [nextGame, setNextGame] = useState<TournamentSchedule | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfiguration | null>(null);
  const [pointLevels, setPointLevels] = useState<PointLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentDetails(selectedTournament);
    }
  }, [selectedTournament]);

  async function loadTournaments() {
    try {
      const data = await PokerLeagueAPI.getTournaments();
      setTournaments(data);
      if (data.length > 0) {
        setSelectedTournament(data[0]);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTournamentDetails(tournament: Tournament) {
    try {
      // Reset next game state when switching tournaments
      setNextGame(null);
      setGameConfig(null);

      // Load next scheduled game
      const schedule = await PokerLeagueAPI.getTournamentSchedule(tournament.id);

      if (schedule.length > 0) {
        // Find upcoming game (only future dates)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset to start of today for accurate comparison

        const upcoming = schedule.find(s => {
          if (!s.date) return false;
          const gameDate = new Date(s.date);
          gameDate.setHours(0, 0, 0, 0); // Reset to start of day
          return gameDate >= now; // Include today's games
        });

        // Only set next game if there's an actual upcoming game
        if (upcoming) {
          setNextGame(upcoming);

          // Load game configuration
          if (upcoming.gameId) {
            const config = await PokerLeagueAPI.getGameConfigurationById(upcoming.gameId);
            setGameConfig(config);
          }
        }
      }

      // Load points structure
      if (tournament.pointsId) {
        const levels = await PokerLeagueAPI.getPointLevels(tournament.pointsId);
        setPointLevels(levels);
      }
    } catch (error) {
      console.error('Error loading tournament details:', error);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      // Reload tournaments
      await loadTournaments();
      // Reload current tournament details if one is selected
      if (selectedTournament) {
        await loadTournamentDetails(selectedTournament);
      }
      // Increment refresh key to force child components to reload
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-poker-green-dark via-poker-green to-poker-green-light flex items-center justify-center">
        <div className="text-white text-2xl">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-green-dark via-poker-green to-poker-green-light">
      {/* Header */}
      <header className="bg-black bg-opacity-50 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-white hover:text-poker-gold transition-colors p-2"
              aria-label="Toggle tournament list"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="text-3xl">♠♥♦♣</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-poker-gold">
              Grapes Poker League
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`${
                refreshing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2`}
              title="Refresh data"
            >
              <svg
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => navigate('/players')}
              className="bg-poker-gold hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Player Stats
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Tournament List Sidebar */}
          <div
            className={`
              fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
              w-80 lg:w-auto lg:col-span-1
              transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              lg:transform-none
            `}
          >
            <div className="bg-white rounded-lg shadow-xl p-4 h-full lg:h-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-poker-green">Tournaments</h2>
                {/* Close button for mobile */}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden text-gray-600 hover:text-poker-green transition-colors p-1"
                  aria-label="Close tournament list"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setIsSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedTournament?.id === tournament.id
                        ? 'bg-poker-green text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-semibold">{tournament.name}</div>
                    <div className="text-sm mt-1 flex items-center gap-2">
                      {tournament.active ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                          Complete
                        </span>
                      )}
                      <span className={selectedTournament?.id === tournament.id ? 'text-gray-200' : 'text-gray-600'}>
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedTournament && (
              <>
                {/* Tournament Info & Next Game */}
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 text-poker-green">
                    {selectedTournament.name}
                  </h2>
                  {selectedTournament.note && (
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{selectedTournament.note}</p>
                  )}

                  {/* Next Game Details */}
                  {nextGame && gameConfig && (
                    <div className="bg-poker-green bg-opacity-10 rounded-lg p-4 border-l-4 border-poker-gold">
                      <h3 className="text-xl font-bold mb-3 text-poker-green">Next Scheduled Game</h3>
                      <div className="space-y-2 text-gray-800">
                        <p className="text-lg">
                          The next game is <span className="font-bold text-black">{gameConfig.name}</span>.
                        </p>
                        {nextGame.date && (
                          <p className="text-lg">
                            Next game is on the{' '}
                            <span className="font-bold text-black">
                              {new Date(nextGame.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                            {nextGame.time && (
                              <span> at <span className="font-bold text-black">{nextGame.time}</span></span>
                            )}
                            .
                          </p>
                        )}
                        {gameConfig.entryAmount !== undefined && gameConfig.entryAmount > 0 && (
                          <p className="text-lg">
                            Game buy in is{' '}
                            <span className="font-bold text-black">
                              £{gameConfig.entryAmount.toFixed(2)}
                            </span>
                            .
                          </p>
                        )}
                        {gameConfig.numOfRebuys !== undefined && gameConfig.numOfRebuys > 0 && gameConfig.rebuyAmount && (
                          <p className="text-lg">
                            {gameConfig.numOfRebuys} rebuy{gameConfig.numOfRebuys > 1 ? 's' : ''} available of{' '}
                            <span className="font-bold text-black">£{gameConfig.rebuyAmount.toFixed(2)}</span>
                            {gameConfig.rebuyChips && (
                              <span> for {gameConfig.rebuyChips.toLocaleString()} chips</span>
                            )}
                            .
                          </p>
                        )}
                        {gameConfig.numOfAddOn !== undefined && gameConfig.numOfAddOn > 0 && gameConfig.addOnAmount && (
                          <p className="text-lg">
                            {gameConfig.numOfAddOn} addon{gameConfig.numOfAddOn > 1 ? 's' : ''} available of{' '}
                            <span className="font-bold text-black">£{gameConfig.addOnAmount.toFixed(2)}</span>
                            {gameConfig.addOnChips && (
                              <span> for {gameConfig.addOnChips.toLocaleString()} chips</span>
                            )}
                            .
                          </p>
                        )}
                        {gameConfig.bountryOptional === 1 && gameConfig.bountyAmount && (
                          <p className="text-lg">
                            Optional Bounty available for{' '}
                            <span className="font-bold text-black">£{gameConfig.bountyAmount.toFixed(2)}</span>
                            .
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Leaderboard */}
                <Leaderboard key={`leaderboard-${refreshKey}`} tournamentId={selectedTournament.id} />

                {/* Tournament Schedule */}
                <TournamentScheduleTable key={`schedule-${refreshKey}`} tournamentId={selectedTournament.id} />

                {/* Tournament Charts */}
                <TournamentChart key={`chart-${refreshKey}`} tournamentId={selectedTournament.id} />

                {/* Points Structure */}
                {pointLevels.length > 0 && (
                  <div className="bg-white rounded-lg shadow-xl p-6">
                    <h3 className="text-2xl font-bold mb-4 text-poker-green">Points Structure</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-poker-green text-white">
                            <th className="px-4 py-3 text-left">Position</th>
                            <th className="px-4 py-3 text-left">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pointLevels.map((level, index) => (
                            <tr
                              key={level.id}
                              className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                            >
                              <td className="px-4 py-3 font-semibold">
                                {level.levelNum === 1 && '🥇 '}
                                {level.levelNum === 2 && '🥈 '}
                                {level.levelNum === 3 && '🥉 '}
                                {level.levelNum}
                              </td>
                              <td className="px-4 py-3 font-bold text-blue-700">{level.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-600 rounded">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Note:</span> All players will receive at least 10 points.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
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
