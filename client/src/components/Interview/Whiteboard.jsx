import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Pencil, Eraser, Trash2 } from 'lucide-react';

const Whiteboard = forwardRef(({ roomId, socket, initialData }, ref) => {
	const canvasRef = useRef(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentTool, setCurrentTool] = useState('pen');
	const [currentColor, setCurrentColor] = useState('#000000');
	const [lineWidth, setLineWidth] = useState(2);
	const contextRef = useRef();
  
  const drawingHistory = useRef([]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ratio = window.devicePixelRatio || 1;
		canvas.width = canvas.offsetWidth * ratio;
		canvas.height = canvas.offsetHeight * ratio;
		canvas.style.width = `${canvas.offsetWidth}px`;
		canvas.style.height = `${canvas.offsetHeight}px`;

		const context = canvas.getContext('2d');
		context.scale(ratio, ratio);
		context.lineCap = 'round';
		context.strokeStyle = currentColor;
		context.lineWidth = lineWidth;
		contextRef.current = context;
    
    if (initialData) {
      drawingHistory.current = initialData;
      redrawCanvas();
    }

		if (!socket) return;
		socket.emit('join-room', roomId);

		const handleDraw = (data) => {
      drawingHistory.current.push(data);
			drawFromData(data);
		};

		const handleClear = () => {
			clearCanvas();
      drawingHistory.current = [];
		};
    
    const handleGetFullCanvas = (requesterId) => {
      socket.emit('whiteboard-full-sync-response', {
        requesterId,
        history: drawingHistory.current
      });
    };
    
    const handleFullSync = ({ history }) => {
      drawingHistory.current = history;
      redrawCanvas();
    };

		socket.on('whiteboard-draw', handleDraw);
		socket.on('whiteboard-clear', handleClear);
    socket.on('whiteboard-get-full-canvas', handleGetFullCanvas);
    socket.on('whiteboard-full-sync-response', handleFullSync);
    
    if (!initialData?.length) {
      socket.emit('whiteboard-get-full-canvas', { roomId, requesterId: socket.id });
    }

		return () => {
			socket.off('whiteboard-draw', handleDraw);
			socket.off('whiteboard-clear', handleClear);
      socket.off('whiteboard-get-full-canvas', handleGetFullCanvas);
      socket.off('whiteboard-full-sync-response', handleFullSync);
		};
	}, [roomId, socket, initialData]);

	useEffect(() => {
		if (contextRef.current) {
			contextRef.current.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
			contextRef.current.lineWidth = currentTool === 'eraser' ? lineWidth * 3 : lineWidth;
		}
	}, [currentTool, currentColor, lineWidth]);
  
  useImperativeHandle(ref, () => ({
    getCanvasData: () => {
      return drawingHistory.current;
    }
  }));

	const startDrawing = ({ nativeEvent }) => {
		const { offsetX, offsetY } = nativeEvent;
    const point = {
			type: 'start',
			x: offsetX,
			y: offsetY,
			color: currentTool === 'eraser' ? '#ffffff' : currentColor,
			width: currentTool === 'eraser' ? lineWidth * 3 : lineWidth,
		};
		
    drawingHistory.current.push(point);
		drawFromData(point);
    
		socket.emit('whiteboard-draw', { roomId, data: point });
		setIsDrawing(true);
	};

	const draw = ({ nativeEvent }) => {
		if (!isDrawing) return;
		const { offsetX, offsetY } = nativeEvent;
    
    const point = {
			type: 'draw',
			x: offsetX,
			y: offsetY
		};
    
    drawingHistory.current.push(point);
		drawFromData(point);

		socket.emit('whiteboard-draw', { roomId, data: point });
	};

	const stopDrawing = () => {
    if (!isDrawing) return;
    const point = { type: 'stop' };
    drawingHistory.current.push(point);
		drawFromData(point);
    socket.emit('whiteboard-draw', { roomId, data: point });
		setIsDrawing(false);
	};

	const drawFromData = (data) => {
		const context = contextRef.current;
    if (!context) return;
    
		switch(data.type) {
      case 'start':
        context.beginPath();
        context.moveTo(data.x, data.y);
        context.strokeStyle = data.color;
        context.lineWidth = data.width;
        break;
      case 'draw':
        context.lineTo(data.x, data.y);
        context.stroke();
        break;
      case 'stop':
        context.closePath();
        break;
      default:
        break;
    }
	};
  
  const redrawCanvas = () => {
    const context = contextRef.current;
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    drawingHistory.current.forEach(data => {
      drawFromData(data);
    });
  };

	const clearCanvas = () => {
		const canvas = canvasRef.current;
		const context = contextRef.current;
		context.clearRect(0, 0, canvas.width, canvas.height);
	};

	const handleClear = () => {
		clearCanvas();
    drawingHistory.current = [];
		socket.emit('whiteboard-clear', { roomId });
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
});

export default Whiteboard;
