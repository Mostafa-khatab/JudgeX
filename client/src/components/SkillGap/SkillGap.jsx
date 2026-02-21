import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '~/components/ui/progress';
import { Badge } from '~/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { getSkillGap } from '~/services/user';
import { Target, TrendingUp, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

const SkillGap = ({ username }) => {
	const { t } = useTranslation('skillgap');
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		getSkillGap(username)
			.then((res) => {
				setData(res.data);
			})
			.catch((err) => {
				console.error('Failed to fetch skill gap:', err);
			})
			.finally(() => setLoading(false));
	}, [username]);

	if (loading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-32 w-full rounded-2xl" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Skeleton className="h-40 rounded-2xl" />
					<Skeleton className="h-40 rounded-2xl" />
				</div>
			</div>
		);
	}

	if (!data || data.tags?.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-neutral-800">
					<Target className="size-8 text-gray-400" />
				</div>
				<h3 className="text-lg font-semibold text-gray-800 dark:text-white">Not Enough Data</h3>
				<p className="max-w-xs text-gray-500 dark:text-gray-400">
					Start solving problems to see your skill gap analysis!
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
			{/* Summary Header */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="border-none shadow-sm dark:bg-neutral-800 overflow-hidden relative">
					<div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
								<BookOpen className="size-5" />
							</div>
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400">Topics Explored</p>
								<h4 className="text-2xl font-bold">{data.tags.length}</h4>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm dark:bg-neutral-800 overflow-hidden relative">
					<div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-green-500/10 text-green-500">
								<CheckCircle2 className="size-5" />
							</div>
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400">Problems Solved</p>
								<h4 className="text-2xl font-bold">{data.summary.uniqueProblemsAttempted}</h4>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm dark:bg-neutral-800 overflow-hidden relative">
					<div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
								<TrendingUp className="size-5" />
							</div>
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400">Top Topic</p>
								<h4 className="text-lg font-bold truncate">
									{data.summary.topTopic}
								</h4>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Breakdown */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Strengths */}
				<section className="space-y-4">
					<h3 className="text-lg font-bold flex items-center gap-2 text-green-600">
						<CheckCircle2 className="size-5" />
						Your Strengths
					</h3>
					{data.summary.strongTopics.length > 0 ? (
						<div className="space-y-4">
							{data.tags
								.filter((t) => data.summary.strongTopics.includes(t.tag))
								.map((topic) => (
									<TopicRow key={topic.tag} topic={topic} variant="success" />
								))}
						</div>
					) : (
						<p className="text-sm text-gray-500 italic">Keep practicing to build strong topics!</p>
					)}
				</section>

				{/* Weaknesses / Opportunities */}
				<section className="space-y-4">
					<h3 className="text-lg font-bold flex items-center gap-2 text-amber-600">
						<AlertCircle className="size-5" />
						Growth Opportunities
					</h3>
					{data.summary.weakTopics.length > 0 ? (
						<div className="space-y-4">
							{data.tags
								.filter((t) => data.summary.weakTopics.includes(t.tag))
								.map((topic) => (
									<TopicRow key={topic.tag} topic={topic} variant="warning" />
								))}
						</div>
					) : (
						<p className="text-sm text-gray-500 italic">No major weaknesses identified yet.</p>
					)}
				</section>
			</div>

			{/* All Topics */}
			<Card className="border-none shadow-sm dark:bg-neutral-800">
				<CardHeader>
					<CardTitle className="text-lg">All Knowledge Areas</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{data.tags.map((topic) => (
							<div key={topic.tag} className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">{topic.tag}</span>
									<span className="text-xs text-gray-500">{topic.strength}%</span>
								</div>
								<Progress value={topic.strength} className="h-1.5" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

const TopicRow = ({ topic, variant }) => {
	const colors = {
		success: {
			bg: 'bg-green-500/10',
			bar: 'bg-green-500',
			text: 'text-green-700 dark:text-green-400',
		},
		warning: {
			bg: 'bg-amber-500/10',
			bar: 'bg-amber-500',
			text: 'text-amber-700 dark:text-amber-400',
		},
	};

	const c = colors[variant];

	return (
		<div className={`p-4 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-neutral-700 transition-all bg-gray-50/50 dark:bg-neutral-800/50`}>
			<div className="flex items-center justify-between mb-3">
				<Badge variant="outline" className={`capitalize font-bold ${c.text} border-${variant}-500/30`}>
					{topic.tag}
				</Badge>
				<span className="text-xs text-gray-500">
					{topic.problemsSolved}/{topic.problemsAttempted} Solved
				</span>
			</div>
			<div className="space-y-1.5">
				<div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
					<div 
						className={`h-full rounded-full ${c.bar} transition-all duration-1000`} 
						style={{ width: `${topic.strength}%` }}
					/>
				</div>
				<div className="flex items-center justify-between text-[10px] text-gray-500">
					<span>Mastery Level</span>
					<span>{topic.strength}%</span>
				</div>
			</div>
		</div>
	);
};

export default SkillGap;
