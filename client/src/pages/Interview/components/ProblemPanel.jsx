import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '~/components/ui/badge';

const ProblemPanel = ({ problem }) => {
  if (!problem) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4">
        <FileText className="h-12 w-12 opacity-20" />
        <p>No problem selected yet</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center text-blue-200/90">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black tracking-tight truncate">{problem.name}</h3>
            <div className="flex items-center gap-4 mt-1 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {problem.timeLimit || 1000}ms
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {problem.memoryLimit || 256}MB
              </span>
            </div>
          </div>
        </div>
        <Badge
          className={
            problem.difficulty === 'easy'
              ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
              : problem.difficulty === 'medium'
                ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                : 'bg-rose-400/10 text-rose-300 border border-rose-400/20'
          }
        >
          {problem.difficulty}
        </Badge>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {problem.task || problem.description}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ProblemPanel;
