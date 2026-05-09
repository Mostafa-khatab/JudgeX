import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock9, Star, CircleCheck, MemoryStick } from 'lucide-react';

import { getProblemsByContest } from '~/services/contest';
import routesConfig from '~/config/routes';

const ContestProblems = () => {
	const { t } = useTranslation('contest');
	const { id } = useParams();
	const [problems, setProblems] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProblems = async () => {
			try {
				const data = await getProblemsByContest(id);
				console.log('Problems data:', data); // للتأكد من البيانات التي نتلقاها
				setProblems(data.problems || []);
			} catch (err) {
				console.error('Error fetching problems:', err);
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchProblems();
		}
	}, [id]);

	console.log('Component state:', { id, loading, problems }); // للتأكد من حالة المكون

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.01] shadow-2xl backdrop-blur-sm"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/5">
              <th className="w-20 px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">#</th>
              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t('problem')}</th>
              <th className="w-32 px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t('points')}</th>
              <th className="w-32 px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t('solved')}</th>
              <th className="w-32 px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t('memory')}</th>
              <th className="w-32 px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t('time')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-6"><div className="h-4 w-8 mx-auto rounded-full bg-white/5" /></td>
                      <td className="px-6 py-6"><div className="h-4 w-48 rounded-full bg-white/5" /></td>
                      <td className="px-6 py-6"><div className="h-4 w-12 mx-auto rounded-full bg-white/5" /></td>
                      <td className="px-6 py-6"><div className="h-4 w-12 mx-auto rounded-full bg-white/5" /></td>
                      <td className="px-6 py-6"><div className="h-4 w-16 mx-auto rounded-full bg-white/5" /></td>
                      <td className="px-6 py-6"><div className="h-4 w-16 mx-auto rounded-full bg-white/5" /></td>
                    </tr>
                  ))
              : problems.map((problem, index) => (
                  <tr
                    key={problem.id}
                    className="group transition-all duration-300 hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-6 text-center">
                      <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-xs font-black text-white/60 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-all">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <Link
                        to={routesConfig.problem.replace(':id', problem.id)}
                        className="text-base font-black tracking-tight text-white/80 hover:text-blue-400 transition-colors"
                      >
                        {problem.name}
                      </Link>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-400/80">
                        <Star className="h-3.5 w-3.5 fill-amber-400/20" />
                        {problem.point}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-400/80">
                        <CircleCheck className="h-3.5 w-3.5" />
                        {problem.noOfSubm === 0 ? 0 : Math.round((problem.noOfSuccess / problem.noOfSubm) * 100)}%
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-white/40">
                        <MemoryStick className="h-3.5 w-3.5" />
                        {problem.memoryLimit}MB
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-white/40">
                        <Clock9 className="h-3.5 w-3.5" />
                        {problem.timeLimit}s
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default ContestProblems;
