import { useState, useEffect } from 'react';
import userService from '../services/userService';
import contestService from '../services/contestService';

export const useHomeData = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    problemsSolved: 842,
    totalSubmissions: 15200,
    newUsers: 124,
    globalActivity: 'ACTIVE'
  });
  const [contests, setContests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [leaderboardRes, contestsRes, statsRes] = await Promise.all([
        userService.getLeaderboard({ size: 5, sortBy: 'totalScore', order: 'desc' }),
        contestService.getUpcomingContests(),
        userService.getGlobalStats()
      ]);

      const leaderboardData = leaderboardRes?.data || (Array.isArray(leaderboardRes) ? leaderboardRes : []);
      const contestsData = contestsRes?.data || contestsRes?.contests || (Array.isArray(contestsRes) ? contestsRes : []);
      const statsData = statsRes?.data || {
        totalProblems: 842,
        totalSubmissions: 15200,
        totalUsers: 124,
        globalActivity: 'ACTIVE'
      };

      setLeaderboard(leaderboardData);
      setContests(contestsData);
      
      setStats({
        problemsSolved: statsData.totalProblems,
        totalSubmissions: statsData.totalSubmissions,
        newUsers: statsData.totalUsers,
        globalActivity: statsData.globalActivity
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  return { loading, stats, contests, leaderboard, error, refresh: fetchHomeData };
};