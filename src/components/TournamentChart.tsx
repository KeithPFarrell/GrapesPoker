import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PokerLeagueAPI } from '../services/api';
import type { TournamentSchedule } from '../types/api';

interface TournamentChartProps {
  tournamentId: string;
}

interface ChartData {
  week: string;
  players: number;
  weekNumber: number;
}

export default function TournamentChart({ tournamentId }: TournamentChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [tournamentId]);

  async function loadChartData() {
    try {
      setLoading(true);
      const [liveGames, schedules] = await Promise.all([
        PokerLeagueAPI.getLiveGames(tournamentId),
        PokerLeagueAPI.getTournamentSchedule(tournamentId),
      ]);

      // Create a map of scheduleId to schedule
      const scheduleMap = new Map<string, TournamentSchedule>();
      schedules.forEach(s => scheduleMap.set(s.id, s));

      // Transform data for charts
      const data: ChartData[] = liveGames
        .map((game) => {
          const schedule = game.scheduleId ? scheduleMap.get(game.scheduleId) : null;
          const weekNum = schedule?.weekNum || 0;

          return {
            week: weekNum > 0 ? `Week ${weekNum}` : 'Game',
            players: game.numOfPlayers || 0,
            weekNumber: weekNum,
          };
        })
        .sort((a, b) => a.weekNumber - b.weekNumber); // Sort by week number

      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="text-center text-gray-600">Loading charts...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h3 className="text-2xl font-bold mb-4 text-poker-green">Tournament Progress</h3>
        <div className="text-center text-gray-600 py-8">
          No game data available yet for this tournament.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-6 text-poker-green">Tournament Progress</h3>

      <div className="space-y-8">
        {/* Player Participation Chart */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-700">Player Participation</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="players"
                stroke="#0e7a3e"
                strokeWidth={3}
                name="Players"
                dot={{ fill: '#0e7a3e', r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-poker-green bg-opacity-10 rounded-lg p-4 border-l-4 border-poker-green">
            <div className="text-sm text-gray-600 font-semibold">Total Games</div>
            <div className="text-3xl font-bold text-poker-green">{chartData.length}</div>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-600">
            <div className="text-sm text-gray-600 font-semibold">Avg Players per Game</div>
            <div className="text-3xl font-bold text-blue-700">
              {chartData.length > 0
                ? (chartData.reduce((sum, d) => sum + d.players, 0) / chartData.length).toFixed(1)
                : '0.0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
