import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { ScrollArea } from '~/components/ui/scroll-area';

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
    <div className="h-full flex flex-col bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-lg">{problem.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={
            problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
            problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
            'bg-red-500/10 text-red-500'
          }>
            {problem.difficulty}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none">
        <div className="flex items-center gap-4 mb-6 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {problem.timeLimit || 1000}ms
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {problem.memoryLimit || 256}MB
          </span>
        </div>

        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {problem.task || problem.description}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ProblemPanel;
