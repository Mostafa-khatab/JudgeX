/* eslint-disable react/prop-types */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const PuzzleModal = ({ isOpen, onClose, node, onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({ type: null, message: '' });

  useEffect(() => {
    if (isOpen) {
      setAnswers({});
      setFeedback({ type: null, message: '' });
    }
  }, [isOpen]);

  if (!node || !node.puzzle || !node.puzzle.questions) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    const allAnswered = node.puzzle.questions.every((_, idx) => answers[idx]);
    if (!allAnswered) return;

    const allCorrect = node.puzzle.questions.every(
      (q, idx) => String(answers[idx]).trim() === String(q.answer).trim()
    );

    if (allCorrect) {
      toast.success("Correct! You've mastered this node.");
      onComplete(node.id);
      onClose();
    } else {
      setFeedback({
        type: 'error',
        message: 'Some answers are incorrect. Please review the concepts and try again.',
      });
    }
  };

  const handleOptionChange = (qIndex, opt) => {
    setAnswers(prev => ({ ...prev, [qIndex]: opt }));
    if (feedback.type === 'error') {
      setFeedback({ type: null, message: '' });
    }
  };

  const allAnswered = Object.keys(answers).length === node.puzzle.questions.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1b1b1d]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">{node.title} - Mini Puzzle</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {node.description}
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-6">
          {node.puzzle.videoUrl && (
            <div className="w-full aspect-video rounded-md overflow-hidden bg-black">
              <iframe
                width="100%"
                height="100%"
                src={node.puzzle.videoUrl}
                title="Lesson Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
          
          <div className="space-y-6">
            {node.puzzle.questions.map((q, qIndex) => (
              <div key={qIndex} className="space-y-2">
                <p className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                  {qIndex + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const isSelected = answers[qIndex] === opt;
                    const isError = isSelected && feedback.type === 'error';
                    
                    return (
                      <label 
                        key={idx} 
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          isError 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`puzzle_option_${qIndex}`}
                          value={opt}
                          checked={isSelected}
                          onChange={() => handleOptionChange(qIndex, opt)}
                          className="hidden"
                        />
                        <span className={`ml-2 ${isError ? 'text-red-700 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* In-Modal Feedback Display */}
          {feedback.message && (
            <div className={`mt-4 p-3 rounded-md text-sm font-medium ${
              feedback.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''
            }`}>
              {feedback.message}
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-4 sticky bottom-0 bg-white dark:bg-[#1b1b1d] pt-2 pb-1 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || feedback.type === 'error'}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            Submit Answers
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
