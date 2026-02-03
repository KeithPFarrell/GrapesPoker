import { useEffect, useState } from 'react';
import { PokerLeagueAPI } from '../services/api';
import type { TournamentPlayer, Player, LeaderboardView, LeaderboardEntry } from '../types/api';
import PlayerDetailModal from './PlayerDetailModal';

interface LeaderboardProps {
  tournamentId: string;
}

export default function Leaderboard({ tournamentId }: LeaderboardProps) {
  const [view, setView] = useState<LeaderboardView>('points');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [tournamentId]);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      const [tournamentPlayers, allPlayers] = await Promise.all([
        PokerLeagueAPI.getTournamentPlayers(tournamentId),
        PokerLeagueAPI.getPlayers(),
      ]);

      // Create player map
      const playerMap = new Map<string, Player>();
      allPlayers.forEach(player => {
        playerMap.set(player.id, player);
      });
      setPlayers(playerMap);

      // Create leaderboard entries
      const entries: LeaderboardEntry[] = tournamentPlayers.map((tp, index) => ({
        ...tp,
        rank: index + 1,
        totalPoints: tp.totalPoints || 0,
        gamesPlayed: tp.gamesPlayed || 0,
        // Map API fields to display fields
        totalWinnings: tp.earnings || 0,           // API uses earnings for prize money won
        totalKnockouts: tp.totalEliminated || 0,   // API uses totalEliminated for knockouts
        totalBounties: tp.totalBounties || 0,
        averagePoints: (tp.gamesPlayed && tp.totalPoints && tp.gamesPlayed > 0)
          ? tp.totalPoints / tp.gamesPlayed
          : 0,
        player: playerMap.get(tp.playerId) || {
          id: tp.playerId,
          orgId: '',
          firstName: 'Unknown',
          lastName: 'Player',
        },
      }));

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSortedLeaderboard(): LeaderboardEntry[] {
    const sorted = [...leaderboard];
    switch (view) {
      case 'points':
        return sorted.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      case 'winnings':
        return sorted.sort((a, b) => (b.totalWinnings || 0) - (a.totalWinnings || 0));
      case 'knockouts':
        return sorted.sort((a, b) => (b.totalKnockouts || 0) - (a.totalKnockouts || 0));
      case 'bounties':
        return sorted.sort((a, b) => (b.totalBounties || 0) - (a.totalBounties || 0));
      default:
        return sorted;
    }
  }

  const tabs: { view: LeaderboardView; label: string; icon: string }[] = [
    { view: 'points', label: 'Points', icon: '🏆' },
    { view: 'winnings', label: 'Winnings', icon: '💰' },
    { view: 'knockouts', label: 'Knockouts', icon: '⚔️' },
    { view: 'bounties', label: 'Bounties', icon: '🎯' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="text-center text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  const sortedData = getSortedLeaderboard();

  return (
    <>
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h3 className="text-2xl font-bold mb-4 text-poker-green">Tournament Leaderboard</h3>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.view}
              onClick={() => setView(tab.view)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                view === tab.view
                  ? 'bg-poker-green text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-poker-green text-white">
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-center">Games</th>
                {view === 'points' && (
                  <>
                    <th className="px-4 py-3 text-right">Avg Points</th>
                    <th className="px-4 py-3 text-right">Total Points</th>
                  </>
                )}
                {view === 'winnings' && (
                  <th className="px-4 py-3 text-right">Total Winnings</th>
                )}
                {view === 'knockouts' && (
                  <th className="px-4 py-3 text-right">Total Knockouts</th>
                )}
                {view === 'bounties' && (
                  <th className="px-4 py-3 text-right">Total Bounties</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((entry, index) => {
                const hasPlayedTenGames = entry.gamesPlayed >= 10;
                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedPlayer(entry)}
                    className={`cursor-pointer transition-colors ${
                      hasPlayedTenGames
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : index % 2 === 0
                          ? 'bg-gray-50 hover:bg-poker-green hover:bg-opacity-10'
                          : 'bg-white hover:bg-poker-green hover:bg-opacity-10'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold">
                      {index === 0 && '🥇 '}
                      {index === 1 && '🥈 '}
                      {index === 2 && '🥉 '}
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold flex items-center gap-2">
                        {entry.player.firstName} {entry.player.lastName}
                        {hasPlayedTenGames && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                            10+ Games
                          </span>
                        )}
                      </div>
                      {entry.player.nickname && (
                        <div className="text-sm text-gray-600">"{entry.player.nickname}"</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{entry.gamesPlayed}</td>
                    {view === 'points' && (
                      <>
                        <td className="px-4 py-3 text-right">
                          {entry.averagePoints?.toFixed(1) || '0.0'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">
                          {entry.totalPoints || 0}
                        </td>
                      </>
                    )}
                    {view === 'winnings' && (
                      <td className="px-4 py-3 text-right font-bold text-blue-700">
                        £{(entry.totalWinnings || 0).toFixed(2)}
                      </td>
                    )}
                    {view === 'knockouts' && (
                      <td className="px-4 py-3 text-right font-bold text-blue-700">
                        {entry.totalKnockouts || 0}
                      </td>
                    )}
                    {view === 'bounties' && (
                      <td className="px-4 py-3 text-right font-bold text-blue-700">
                        {entry.totalBounties || 0}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedData.length === 0 && (
          <div className="text-center text-gray-600 py-8">
            No players found for this tournament.
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          tournamentId={tournamentId}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  );
}
