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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-x-auto rounded-lg bg-white shadow-md dark:bg-neutral-800"
      >
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b border-gray-200 dark:border-neutral-700">
              <th className="w-16 px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">#</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">{t('problem')}</th>
              <th className="w-24 px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">{t('points')}</th>
              <th className="w-24 px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">{t('solved')}</th>
              <th className="w-24 px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">{t('memory')}</th>
              <th className="w-24 px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">{t('time')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <tr key={index} className="animate-pulse border-b border-gray-200 dark:border-neutral-700">
                  <td className="px-6 py-4">
                    <div className="h-4 w-8 rounded bg-gray-200 dark:bg-neutral-700"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-full rounded bg-gray-200 dark:bg-neutral-700"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-12 rounded bg-gray-200 dark:bg-neutral-700"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-12 rounded bg-gray-200 dark:bg-neutral-700"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 rounded bg-gray-200 dark:bg-neutral-700"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 rounded bg-gray-200 dark:bg-neutral-700"></div>
                  </td>
                </tr>
              ))
            ) : (
              problems.map((problem, index) => (
                <tr
                  key={problem.id}
                  className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700/20"
                >
                  <td className="px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-200">
                    {String.fromCharCode(65 + index)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={routesConfig.problem.replace(':id', problem.id)}
                      className="text-gray-700 hover:text-blue-500 dark:text-gray-200 dark:hover:text-blue-400"
                    >
                      {problem.name}
                    </Link>
                  </td>
                  <td className="flex items-center justify-center gap-1 px-6 py-4 text-gray-600 dark:text-gray-300">
                    <Star className="h-4 w-4" />
                    {problem.point}
                  </td>
                  <td className="flex items-center justify-center gap-1 px-6 py-4 text-gray-600 dark:text-gray-300">
                    <CircleCheck className="h-4 w-4" />
                    {problem.noOfSubm === 0 ? 0 : Math.round((problem.noOfSuccess / problem.noOfSubm) * 100)}%
                  </td>
                  <td className="flex items-center justify-center gap-1 px-6 py-4 text-gray-600 dark:text-gray-300">
                    <MemoryStick className="h-4 w-4" />
                    {problem.memoryLimit}MB
                  </td>
                  <td className="flex items-center justify-center gap-1 px-6 py-4 text-gray-600 dark:text-gray-300">
                    <Clock9 className="h-4 w-4" />
                    {problem.timeLimit}s
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default ContestProblems;