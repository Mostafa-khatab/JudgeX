/* eslint-disable react/prop-types */
import { motion } from 'framer-motion';
import { Check, Lock, Unlock, Waypoints } from 'lucide-react';
import { Progress } from '~/components/ui/progress';

export const RoadmapNode = ({ node, isLeft, onClick, onVerify }) => {
  const isCompleted = node.status === 'completed';
  const isUnlocked = node.status === 'unlocked';
  const isLocked = node.status === 'locked';

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-700 text-white';
    if (isUnlocked) return 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-700 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]';
    return 'bg-gray-200 border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 text-gray-500 dark:text-gray-400';
  };

  const getIcon = () => {
    if (isCompleted) return <Check size={24} />;
    if (isUnlocked) return <Unlock size={24} />;
    return <Lock size={24} />;
  };

  const getTypeIcon = () => <Waypoints className="w-4 h-4 mr-2" />;

  return (
    <motion.div
      className={`relative flex items-center justify-center w-full my-20 ${
        isLeft ? 'flex-row' : 'flex-row-reverse'
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
    >
      <div className={`w-1/2 flex ${isLeft ? 'justify-end pr-10 md:pr-16' : 'justify-start pl-10 md:pl-16'}`}>
        <motion.div
          whileHover={!isLocked ? { scale: 1.03, y: -5 } : {}}
          whileTap={!isLocked ? { scale: 0.98 } : {}}
          onClick={() => !isLocked && onClick(node)}
          className={`relative cursor-pointer max-w-sm w-full p-5 md:p-6 rounded-2xl border bg-white dark:bg-[#1b1b1d] transition-all duration-300 ${
            isLocked ? 'opacity-70 cursor-not-allowed border-gray-200 dark:border-zinc-800 grayscale' : 'hover:shadow-xl border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-800'
          }`}
        >
          {/* Badge */}
          <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full flex items-center shadow-sm">
            {getTypeIcon()}
            Topic
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-2">
            {node.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {node.description}
          </p>

          {/* Progress Indicator */}
           {!isLocked && (
             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {node.progress === 100 ? 'Mastered' : 'Progress'}
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {node.progress}%
                </span>
              </div>
               <Progress value={node.progress} className="h-2 bg-gray-100 dark:bg-zinc-800" indicatorClassName={isCompleted ? 'bg-green-500' : 'bg-blue-500'} />

              {node.showVerify && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerify?.(node);
                  }}
                  className="mt-4 w-full px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                  Verify Completion
                </button>
              )}
             </div>
           )}
        </motion.div>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center z-20">
        <motion.div
          whileHover={!isLocked ? { scale: 1.1, rotate: 10 } : {}}
          whileTap={!isLocked ? { scale: 0.9 } : {}}
          onClick={() => !isLocked && onClick(node)}
          className={`w-14 h-14 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 bg-white dark:bg-[#1b1b1d] ${getStatusColor()}`}
          style={{
            boxShadow: isUnlocked ? '0 0 0 8px rgba(59, 130, 246, 0.1)' : isCompleted ? '0 0 0 8px rgba(16, 185, 129, 0.1)' : 'none'
          }}
        >
          {getIcon()}
        </motion.div>
      </div>
    </motion.div>
  );
};
