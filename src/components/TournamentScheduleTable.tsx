import { useEffect, useState } from 'react';
import { PokerLeagueAPI } from '../services/api';
import type { TournamentSchedule, GameConfiguration } from '../types/api';
import GameResultsModal from './GameResultsModal';

interface TournamentScheduleTableProps {
  tournamentId: string;
}

export default function TournamentScheduleTable({ tournamentId }: TournamentScheduleTableProps) {
  const [schedules, setSchedules] = useState<TournamentSchedule[]>([]);
  const [gameConfigs, setGameConfigs] = useState<Map<string, GameConfiguration>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<TournamentSchedule | null>(null);

  useEffect(() => {
    loadSchedule();
  }, [tournamentId]);

  async function loadSchedule() {
    try {
      setLoading(true);
      const scheduleData = await PokerLeagueAPI.getTournamentSchedule(tournamentId);

      // Fetch all unique game configurations
      const uniqueGameIds = [...new Set(scheduleData.map(s => s.gameId).filter(Boolean))];
      const configPromises = uniqueGameIds.map(id =>
        PokerLeagueAPI.getGameConfigurationById(id!)
      );
      const configs = await Promise.all(configPromises);

      // Create game config map
      const configMap = new Map<string, GameConfiguration>();
      configs.forEach(config => {
        if (config) {
          configMap.set(config.id, config);
        }
      });

      setGameConfigs(configMap);
      setSchedules(scheduleData.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateA.getTime() - dateB.getTime();
      }));
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  function isGameCompleted(schedule: TournamentSchedule): boolean {
    if (!schedule.date) return false;
    const gameDate = new Date(schedule.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return gameDate < now || schedule.status === 'COMPLETED';
  }

  function handleRowClick(schedule: TournamentSchedule) {
    if (isGameCompleted(schedule)) {
      setSelectedSchedule(schedule);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="text-center text-gray-600">Loading schedule...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h3 className="text-2xl font-bold mb-4 text-poker-green">Tournament Schedule</h3>

        {schedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-poker-green text-white">
                  <th className="px-4 py-3 text-left">Week</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Game Type</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule, index) => {
                  const gameConfig = schedule.gameId ? gameConfigs.get(schedule.gameId) : null;
                  const isCompleted = isGameCompleted(schedule);
                  const isClickable = isCompleted;

                  return (
                    <tr
                      key={schedule.id}
                      onClick={() => handleRowClick(schedule)}
                      className={`${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } ${
                        isClickable ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold">
                        {schedule.weekNum ? `Week ${schedule.weekNum}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {schedule.date ? new Date(schedule.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {schedule.time || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {gameConfig?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isCompleted ? (
                          <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                            Completed
                          </span>
                        ) : (
                          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            No scheduled games found for this tournament.
          </div>
        )}

        {schedules.some(s => isGameCompleted(s)) && (
          <div className="mt-4 text-sm text-gray-600 italic">
            * Click on completed games to view results
          </div>
        )}
      </div>

      {/* Game Results Modal */}
      {selectedSchedule && (
        <GameResultsModal
          schedule={selectedSchedule}
          tournamentId={tournamentId}
          gameConfig={selectedSchedule.gameId ? gameConfigs.get(selectedSchedule.gameId) : null}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </>
  );
}
