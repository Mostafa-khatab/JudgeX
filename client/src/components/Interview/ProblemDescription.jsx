import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Clean and format problem task content
 */
const formatTaskContent = (task) => {
  if (!task) return '';
  
  let content = task;
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = content;
  content = textarea.value;
  
  // Clean up common formatting issues from scraped content
  content = content
    // Remove duplicate asterisks patterns like * *
    .replace(/\*\s*\*/g, '')
    // Clean mathematical notation subscripts/superscripts
    .replace(/𝑠/g, 's')
    .replace(/𝑛/g, 'n')
    .replace(/𝑎/g, 'a')
    .replace(/𝑖/g, 'i')
    .replace(/𝑡/g, 't')
    .replace(/𝑥/g, 'x')
    .replace(/𝑦/g, 'y')
    .replace(/𝑘/g, 'k')
    .replace(/𝑚/g, 'm')
    .replace(/𝑝/g, 'p')
    .replace(/𝑞/g, 'q')
    .replace(/𝑟/g, 'r')
    .replace(/𝑐/g, 'c')
    .replace(/𝑏/g, 'b')
    // Fix escaped characters
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '  ')
    // Clean up HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove duplicate spaces but keep newlines
    .replace(/[^\S\n]+/g, ' ')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n');
  
  return content.trim();
};

/**
 * Component to render problem description with proper formatting
 */
const ProblemDescription = ({ problem, weight, showTestCases = true }) => {
  if (!problem) {
    return (
      <div className="p-6 text-gray-400 italic text-center">
        جاري تحميل السؤال...
      </div>
    );
  }

  const formattedTask = formatTaskContent(problem.task);

  return (
    <div className="space-y-4">
      {/* Problem Header */}
      <div className="pb-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-3">{problem.name || problem.title}</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`px-2.5 py-1 rounded-full font-medium ${
              problem.difficulty === 'easy'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : problem.difficulty === 'hard'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {problem.difficulty === 'easy' ? 'Easy' : problem.difficulty === 'hard' ? 'Hard' : 'Medium'}
          </span>
          {problem.timeLimit && (
            <span className="text-gray-400 flex items-center gap-1">
              <span className="text-xs">⏱️</span> {problem.timeLimit}s
            </span>
          )}
          {problem.memoryLimit && (
            <span className="text-gray-400 flex items-center gap-1">
              <span className="text-xs">💾</span> {problem.memoryLimit}MB
            </span>
          )}
          {weight && (
            <span className="text-blue-400 flex items-center gap-1">
              <span className="text-xs">⭐</span> {weight} pts
            </span>
          )}
        </div>
      </div>

      {/* Problem Description */}
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom rendering for code blocks
            code: ({ node, inline, className, children, ...props }) => {
              return inline ? (
                <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto border border-gray-700">
                  <code {...props}>{children}</code>
                </pre>
              );
            },
            // Custom paragraph styling
            p: ({ children }) => (
              <p className="text-gray-300 leading-relaxed mb-3">{children}</p>
            ),
            // Custom heading styles
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-white mt-4 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-white mt-4 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-300 mt-3 mb-2">{children}</h3>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>
            ),
          }}
        >
          {formattedTask}
        </ReactMarkdown>
      </div>

      {/* Test Cases / Examples */}
      {showTestCases && problem.testcase?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
            Examples
          </h3>
          <div className="space-y-3">
            {problem.testcase.slice(0, 3).map((tc, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Input #{idx + 1}</span>
                  <pre className="text-green-400 bg-gray-900 p-2.5 rounded-lg text-xs overflow-x-auto border border-gray-700 font-mono">
                    {tc.stdin}
                  </pre>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Output #{idx + 1}</span>
                  <pre className="text-blue-400 bg-gray-900 p-2.5 rounded-lg text-xs overflow-x-auto border border-gray-700 font-mono">
                    {tc.stdout}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemDescription;
