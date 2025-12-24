import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { toast } from 'react-toastify';
import { sendChatMessage } from '~/services/chatbot';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatBot = ({ problemId, code, language, isOpen = false, onClose = () => {} }) => {
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
			<div className="flex items-center justify-between gap-2 rounded-t-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3">
				<div className="flex items-center gap-2">
					<Bot className="h-5 w-5 text-white" />
					<h3 className="font-semibold text-white">AI Assistant</h3>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => {
							// optional: clear messages when closing
							// setMessages([]);
							onClose();
						}}
						className="rounded-full p-1 text-white transition hover:bg-white/20"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4">
				{messages.length === 0 && (
					<div className="flex h-full flex-col items-center justify-center text-center">
						<Bot className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-600" />
						<p className="text-sm text-gray-500 dark:text-gray-400">اسأل عن المسألة أو شارك كودك — سأساعدك خطوة بخطوة.</p>
					</div>
				)}

				<div className="space-y-4">
					{messages.map((message, idx) => (
						<div key={idx} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
							{message.role === 'assistant' && (
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
									<Sparkles className="h-4 w-4 text-white" />
								</div>
							)}
							<div className={`max-w-[85%] rounded-lg px-4 py-3 ${message.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-gray-100'}`}>
								{message.role === 'assistant' ? (
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<Markdown
											components={{
												code({ node, inline, className, children, ...props }) {
													const match = /language-(\w+)/.exec(className || '');
													return !inline && match ? (
														<SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-md text-xs" {...props}>
															{String(children).replace(/\n$/, '')}
														</SyntaxHighlighter>
													) : (
														<code className="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-neutral-700" {...props}>
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
									<p className="whitespace-pre-wrap text-sm">{message.content}</p>
								)}
							</div>
							{message.role === 'user' && (
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-700">
									<User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
								</div>
							)}
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
			<div className="border-t border-gray-200 p-3 dark:border-neutral-800">
				<div className="flex gap-2">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="اطرح سؤالك هنا..."
						disabled={isLoading}
						className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
						rows={2}
					/>
					<Button onClick={handleSend} disabled={!input.trim() || isLoading} className="h-auto bg-gradient-to-r from-blue-600 to-indigo-600">
						{isLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ChatBot;
