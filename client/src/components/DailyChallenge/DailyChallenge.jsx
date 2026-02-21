import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDailyChallenge, getStreak } from '~/services/dailyChallenge';
import routesConfig from '~/config/routes';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Flame, Target, Clock, ArrowRight, Zap, Trophy, Sparkles } from 'lucide-react';

const difficultyColors = {
	easy: 'text-green-500 bg-green-500/10 border-green-500/20',
	medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
	hard: 'text-red-500 bg-red-500/10 border-red-500/20',
};

const difficultyLabels = {
	easy: 'Easy',
	medium: 'Medium',
	hard: 'Hard',
};

const DailyChallenge = () => {
	const [challenge, setChallenge] = useState(null);
	const [streak, setStreak] = useState(null);
	const [loading, setLoading] = useState(true);
	const [timeLeft, setTimeLeft] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [challengeRes, streakRes] = await Promise.all([
					getDailyChallenge(),
					getStreak(),
				]);
				setChallenge(challengeRes?.data);
				setStreak(streakRes?.data);
			} catch (err) {
				console.error('Failed to fetch daily challenge:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	// Countdown timer to midnight
	useEffect(() => {
		const updateTimer = () => {
			const now = new Date();
			const midnight = new Date(now);
			midnight.setDate(midnight.getDate() + 1);
			midnight.setHours(0, 0, 0, 0);

			const diff = midnight - now;
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			setTimeLeft(
				`${hours.toString().padStart(2, '0')}:${minutes
					.toString()
					.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
			);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, []);

	const confidencePercent = challenge ? Math.round(challenge.predictedScore * 100) : 0;

	if (loading) {
		return (
			<Card className="border-none shadow-sm dark:bg-neutral-800">
				<CardHeader className="pb-3 border-b dark:border-neutral-700">
					<Skeleton className="h-6 w-40" />
				</CardHeader>
				<CardContent className="pt-4 space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-4 w-24" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-none shadow-sm dark:bg-neutral-800 overflow-hidden relative">
			{/* Gradient accent */}
			<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500" />

			<CardHeader className="pb-3 border-b dark:border-neutral-700">
				<CardTitle className="text-lg font-bold flex items-center justify-between">
					<span className="flex items-center gap-2">
						<Target className="size-5 text-sky-500" />
						Daily Challenge
					</span>
					{streak && streak.currentStreak > 0 && (
						<span className="flex items-center gap-1 text-sm font-semibold text-orange-500">
							<Flame className="size-4 animate-pulse" />
							{streak.currentStreak}
						</span>
					)}
				</CardTitle>
			</CardHeader>

			<CardContent className="pt-4 px-4 pb-4 space-y-4">
				{challenge ? (
					<>
						{/* Problem Info */}
						<Link
							to={routesConfig.problem.replace(':id', challenge.problemId)}
							className="block group"
						>
							<div className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-700/50 group-hover:bg-gray-100 dark:group-hover:bg-neutral-700 transition-colors border border-transparent group-hover:border-gray-200 dark:group-hover:border-neutral-600">
								<div className="flex items-start justify-between mb-2">
									<h3 className="text-sm font-semibold dark:text-gray-200 group-hover:text-sky-500 transition-colors line-clamp-1 flex-1 mr-2">
										{challenge.problemName}
									</h3>
									<ArrowRight className="size-4 text-gray-400 group-hover:text-sky-500 transition-colors flex-shrink-0 mt-0.5" />
								</div>

								{/* Difficulty badge */}
								<span
									className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
										difficultyColors[challenge.difficulty] || difficultyColors.medium
									}`}
								>
									{difficultyLabels[challenge.difficulty] || 'Medium'}
								</span>

								{/* Tags */}
								{challenge.tags && challenge.tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{challenge.tags.slice(0, 3).map((tag) => (
											<span
												key={tag}
												className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-sky-500/10 text-sky-600 dark:text-sky-400"
											>
												{tag}
											</span>
										))}
										{challenge.tags.length > 3 && (
											<span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-500 dark:bg-neutral-600 dark:text-gray-400">
												+{challenge.tags.length - 3}
											</span>
										)}
									</div>
								)}
							</div>
						</Link>

						{/* AI Confidence Bar */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
									<Sparkles className="size-3 text-purple-500" />
									AI Match Score
								</span>
								<span className="text-[11px] font-bold text-purple-500">
									{confidencePercent}%
								</span>
							</div>
							<div className="w-full h-1.5 bg-gray-200 dark:bg-neutral-600 rounded-full overflow-hidden">
								<div
									className="h-full rounded-full bg-gradient-to-r from-sky-500 to-purple-500 transition-all duration-1000"
									style={{ width: `${confidencePercent}%` }}
								/>
							</div>
							<p className="text-[10px] text-gray-400 dark:text-gray-500">
								Calibrated to your skill level for optimal learning
							</p>
						</div>

						{/* Status & Timer */}
						<div className="flex items-center justify-between pt-1 border-t dark:border-neutral-700">
							<div className="flex items-center gap-1.5">
								{challenge.completed ? (
									<>
										<Trophy className="size-3.5 text-green-500" />
										<span className="text-[11px] font-semibold text-green-500">
											Completed!
										</span>
									</>
								) : (
									<>
										<Zap className="size-3.5 text-amber-500" />
										<span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
											Not solved yet
										</span>
									</>
								)}
							</div>
							<div className="flex items-center gap-1">
								<Clock className="size-3 text-gray-400" />
								<span className="text-[10px] font-mono text-gray-400">
									{timeLeft}
								</span>
							</div>
						</div>

						{/* Streak Info */}
						{streak && (
							<div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-700/30 rounded-lg px-3 py-2">
								<div className="flex items-center gap-1">
									<Flame className="size-3 text-orange-500" />
									<span>Current: <strong className="text-gray-700 dark:text-gray-300">{streak.currentStreak} days</strong></span>
								</div>
								<div className="flex items-center gap-1">
									<Trophy className="size-3 text-yellow-500" />
									<span>Best: <strong className="text-gray-700 dark:text-gray-300">{streak.longestStreak} days</strong></span>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-6">
						<Target className="size-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
						<p className="text-xs text-gray-500 dark:text-gray-400">
							No challenge available today.
							<br />
							Check back later!
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default DailyChallenge;
