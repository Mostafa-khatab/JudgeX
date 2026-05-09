import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { toast } from 'react-toastify';
import { sendChatMessage } from '~/services/chatbot';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatBot = ({ problemId, courseId, code, language, isOpen = false, onClose = () => {} }) => {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

	// If not open, render nothing (sidebar controlled by parent)
	if (!isOpen) return null;

	const handleSend = async () => {
		if (!input.trim() || isLoading) return;

		const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
		setMessages((prev) => [...prev, userMessage]);
		setInput('');
		setIsLoading(true);

		try {
			const response = await sendChatMessage({
				message: input,
				problemId,
				courseId,
				code,
				language,
				history: messages,
			});

			const botMessage = {
				role: 'assistant',
				content: response.data?.message || response.message || 'No response',
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, botMessage]);
		} catch (error) {
			console.error('ChatBot error:', error);
			console.error('Error response:', error.response);
			toast.error(error.response?.data?.msg || error.message || 'Failed to send message');
			// Remove last user message on failure
			setMessages((prev) => prev.slice(0, -1));
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="flex h-full w-full flex-col bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800">
			{/* Header */}
			<div className="flex items-center justify-between gap-2 rounded-t-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3 shadow-lg">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-white/20 rounded-lg">
						<Bot className="h-4 w-4 md:h-5 md:w-5 text-white" />
					</div>
					<h3 className="font-bold text-sm md:text-base text-white tracking-tight">Neural Assistant</h3>
				</div>
				<div className="flex items-center gap-1">
					<button
						onClick={() => setMessages([])}
						title="Clear Chat"
						className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
					>
						<RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
					</button>
					<button
						onClick={onClose}
						className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
					>
						<X className="h-4 w-4 md:h-5 md:w-5" />
					</button>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{messages.length === 0 && (
					<div className="flex h-full flex-col items-center justify-center text-center px-4">
						<div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
							<Bot className="h-8 w-8 text-blue-500" />
						</div>
						<h4 className="text-gray-900 dark:text-white font-bold mb-2">Neural Assistant Active</h4>
						<p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
							{courseId ? "Ask anything about the course content — I'm here to help you master the concepts." : "Ask about the problem or share your code — I'll guide you step by step."}
						</p>
					</div>
				)}

				<div className="space-y-6">
					{messages.map((message, idx) => (
						<div key={idx} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
							{message.role === 'assistant' && (
								<div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 mt-1">
									<Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
								</div>
							)}
							<div className={`max-w-[85%] px-4 py-3 shadow-sm ${
								message.role === 'user' 
									? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none' 
									: 'bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-gray-100 rounded-2xl rounded-tl-none border border-gray-200 dark:border-neutral-700/50'
							}`}>
								{message.role === 'assistant' ? (
									<div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words">
										<Markdown
											components={{
												code({ node, inline, className, children, ...props }) {
													const match = /language-(\w+)/.exec(className || '');
													return !inline && match ? (
														<SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-xl text-[10px] md:text-xs my-3" {...props}>
															{String(children).replace(/\n$/, '')}
														</SyntaxHighlighter>
													) : (
														<code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-mono dark:bg-neutral-700" {...props}>
															{children}
														</code>
													);
												},
											}}
										>
											{message.content}
										</Markdown>
									</div>
								) : (
									<p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed font-medium">{message.content}</p>
								)}
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>

				{isLoading && (
					<div className="flex gap-3">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
							<Bot className="h-4 w-4 text-white" />
						</div>
						<div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-neutral-800">
							<Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
							<span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
						</div>
					</div>
				)}
			</div>

			{/* Input */}
			<div className="p-4 bg-gray-50 dark:bg-neutral-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-neutral-800">
				<div className="relative flex items-end gap-2 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="Message Neural Assistant..."
						disabled={isLoading}
						className="flex-1 max-h-32 min-h-[44px] resize-none bg-transparent px-3 py-2.5 text-sm md:text-base placeholder-gray-400 focus:outline-none dark:text-gray-100"
						rows={1}
					/>
					<Button 
						onClick={handleSend} 
						disabled={!input.trim() || isLoading} 
						className="size-10 md:size-11 shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 transition-all active:scale-95"
					>
						{isLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}
					</Button>
				</div>
				<p className="text-[10px] text-center text-gray-400 mt-2 font-medium">Neural Assistant may generate inaccurate responses.</p>
			</div>
		</div>
	);
};

export default ChatBot;
