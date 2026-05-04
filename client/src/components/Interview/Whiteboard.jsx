import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Pencil, Eraser, Trash2, Square, Circle, ArrowRight } from 'lucide-react';

const Whiteboard = ({ roomId, socketUrl }) => {
	const canvasRef = useRef(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentTool, setCurrentTool] = useState('pen');
	const [currentColor, setCurrentColor] = useState('#000000');
	const [lineWidth, setLineWidth] = useState(2);
	const socketRef = useRef();
	const contextRef = useRef();

	useEffect(() => {
		const canvas = canvasRef.current;
		canvas.width = canvas.offsetWidth * 2;
		canvas.height = canvas.offsetHeight * 2;
		canvas.style.width = `${canvas.offsetWidth}px`;
		canvas.style.height = `${canvas.offsetHeight}px`;

		const context = canvas.getContext('2d');
		context.scale(2, 2);
		context.lineCap = 'round';
		context.strokeStyle = currentColor;
		context.lineWidth = lineWidth;
		contextRef.current = context;

		// Socket setup
		socketRef.current = io(socketUrl);
		socketRef.current.emit('join-room', roomId);

		socketRef.current.on('whiteboard-draw', (data) => {
			drawFromData(data);
		});

		socketRef.current.on('whiteboard-clear', () => {
			clearCanvas();
		});

		return () => {
			socketRef.current.disconnect();
		};
	}, [roomId, socketUrl]);

	useEffect(() => {
		if (contextRef.current) {
			contextRef.current.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
			contextRef.current.lineWidth = currentTool === 'eraser' ? lineWidth * 3 : lineWidth;
		}
	}, [currentTool, currentColor, lineWidth]);

	const startDrawing = ({ nativeEvent }) => {
		const { offsetX, offsetY } = nativeEvent;
		contextRef.current.beginPath();
		contextRef.current.moveTo(offsetX, offsetY);
		setIsDrawing(true);
	};

	const draw = ({ nativeEvent }) => {
		if (!isDrawing) return;
		const { offsetX, offsetY } = nativeEvent;
		contextRef.current.lineTo(offsetX, offsetY);
		contextRef.current.stroke();

		// Emit drawing data to other users
		socketRef.current.emit('whiteboard-draw', {
			roomId,
			data: {
				x: offsetX,
				y: offsetY,
				color: currentTool === 'eraser' ? '#ffffff' : currentColor,
				width: currentTool === 'eraser' ? lineWidth * 3 : lineWidth,
				isEraser: currentTool === 'eraser',
			},
		});
	};

	const stopDrawing = () => {
		contextRef.current.closePath();
		setIsDrawing(false);
	};

	const drawFromData = (data) => {
		const context = contextRef.current;
		context.strokeStyle = data.color;
		context.lineWidth = data.width;
		context.lineTo(data.x, data.y);
		context.stroke();
	};

	const clearCanvas = () => {
		const canvas = canvasRef.current;
		const context = contextRef.current;
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, canvas.width, canvas.height);
	};

	const handleClear = () => {
		clearCanvas();
		socketRef.current.emit('whiteboard-clear', { roomId });
	};

	const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

	return (
		<div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
			{/* Toolbar */}
			<div className="flex items-center gap-2 p-3 bg-gray-100 border-b border-gray-300 rounded-t-lg flex-wrap">
				<div className="flex gap-2 items-center border-r pr-3">
					<button
						onClick={() => setCurrentTool('pen')}
						className={`p-2 rounded ${currentTool === 'pen' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
						title="Pen"
					>
						<Pencil size={20} />
					</button>
					<button
						onClick={() => setCurrentTool('eraser')}
						className={`p-2 rounded ${currentTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
						title="Eraser"
					>
						<Eraser size={20} />
					</button>
				</div>

				<div className="flex gap-1 items-center border-r pr-3">
					{colors.map((color) => (
						<button
							key={color}
							onClick={() => setCurrentColor(color)}
							className={`w-8 h-8 rounded border-2 ${currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'}`}
							style={{ backgroundColor: color }}
							title={color}
						/>
					))}
				</div>

				<div className="flex gap-2 items-center border-r pr-3">
					<label className="text-sm font-medium text-gray-700">Size:</label>
					<input
						type="range"
						min="1"
						max="20"
						value={lineWidth}
						onChange={(e) => setLineWidth(parseInt(e.target.value))}
						className="w-24"
					/>
					<span className="text-sm text-gray-600">{lineWidth}px</span>
				</div>

				<button
					onClick={handleClear}
					className="p-2 rounded bg-red-500 text-white hover:bg-red-600 flex items-center gap-1"
					title="Clear All"
				>
					<Trash2 size={20} />
					<span className="text-sm">Clear</span>
				</button>
			</div>

			{/* Canvas */}
			<canvas
				ref={canvasRef}
				onMouseDown={startDrawing}
				onMouseMove={draw}
				onMouseUp={stopDrawing}
				onMouseLeave={stopDrawing}
				className="flex-1 w-full cursor-crosshair bg-white"
			/>
		</div>
	);
};

export default Whiteboard;
