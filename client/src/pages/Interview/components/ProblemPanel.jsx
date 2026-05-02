import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '~/components/ui/badge';

const ProblemPanel = ({ problem }) => {
  if (!problem) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4">
        <div className="p-4 bg-neutral-100 dark:bg-white/5 rounded-full">
          <FileText className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No problem selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 bg-white">
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0 space-y-1">
            <h3 className="text-lg font-black tracking-tighter text-neutral-900 truncate">{problem.name}</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-blue-500" />
                {problem.timeLimit || 1000}ms
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                {problem.memoryLimit || 256}MB
              </span>
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`h-6 px-3 rounded-full text-[10px] font-black uppercase tracking-widest border-none ${
            problem.difficulty === 'easy'
              ? 'text-emerald-600 bg-emerald-50'
              : problem.difficulty === 'medium'
                ? 'text-amber-600 bg-amber-50'
                : 'text-rose-600 bg-rose-50'
          }`}
        >
          {problem.difficulty}
        </Badge>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8 prose prose-neutral max-w-none prose-p:text-sm prose-p:leading-relaxed prose-headings:font-black prose-headings:tracking-tight prose-code:text-blue-600">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {problem.task || problem.description}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ProblemPanel;
