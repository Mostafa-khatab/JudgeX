import { useRef, useEffect, useState } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { Button } from '~/components/ui/button';
import { PenTool, Eraser, Trash2, Send, Undo2, Redo2 } from 'lucide-react';

const DrawingBoard = ({ problemId, drawingData, onSync, role, on, emit, interviewId }) => {
  const canvasRef = useRef(null);
  const [isEraser, setIsEraser] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);

  // Load initial data
  useEffect(() => {
    if (drawingData && canvasRef.current) {
      try {
        const parsed = typeof drawingData === 'string' ? JSON.parse(drawingData) : drawingData;
        canvasRef.current.loadPaths(parsed);
      } catch (err) {
        console.error('Failed to load drawing data', err);
      }
    }
  }, [drawingData]);

  // Listen for socket updates
  useEffect(() => {
    if (!on) return;
    const cleanupDraw = on('whiteboard-draw', (data) => {
      if (data.problemId === problemId && canvasRef.current && data.drawingData) {
        try {
          const parsed = typeof data.drawingData === 'string' ? JSON.parse(data.drawingData) : data.drawingData;
          canvasRef.current.loadPaths(parsed);
        } catch (e) {
          console.error(e);
        }
      }
    });
    
    const cleanupClear = on('whiteboard-clear', (data) => {
      if (data.problemId === problemId && canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });

    return () => {
      cleanupDraw();
      cleanupClear();
    };
  }, [on, problemId]);

  const handleSync = async () => {
    if (!canvasRef.current || role !== 'interviewer') return;
    try {
      const paths = await canvasRef.current.exportPaths();
      const stringified = JSON.stringify(paths);
      emit('whiteboard-draw', { interviewId, problemId, drawingData: stringified });
      onSync?.(stringified);
      setHasUnsyncedChanges(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      setHasUnsyncedChanges(true);
      if (role === 'interviewer') {
        emit('whiteboard-clear', { interviewId, problemId });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f14] rounded-2xl border border-white/10 overflow-hidden">
      {/* Toolbar */}
      {role === 'interviewer' && (
        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Button
              variant={!isEraser ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setIsEraser(false);
                canvasRef.current?.eraseMode(false);
              }}
              className="h-8 rounded-lg"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Pen
            </Button>
            <Button
              variant={isEraser ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setIsEraser(true);
                canvasRef.current?.eraseMode(true);
              }}
              className="h-8 rounded-lg"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Eraser
            </Button>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="flex gap-1">
              {['#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(color => (
                <button
                  key={color}
                  onClick={() => { setStrokeColor(color); setIsEraser(false); canvasRef.current?.eraseMode(false); }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${strokeColor === color && !isEraser ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <Button variant="ghost" size="icon" onClick={() => canvasRef.current?.undo()} className="h-8 w-8">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => canvasRef.current?.redo()} className="h-8 w-8">
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={handleSync} 
              className={`h-8 ${hasUnsyncedChanges ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' : 'bg-white/10 text-white/50'}`}
            >
              <Send className="h-4 w-4 mr-2" />
              Sync to Candidate
            </Button>
          </div>
        </div>
      )}
      
      {/* Canvas */}
      <div className="flex-1 relative cursor-crosshair">
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          canvasColor="transparent"
          className="absolute inset-0 w-full h-full"
          onChange={() => role === 'interviewer' && setHasUnsyncedChanges(true)}
        />
      </div>
      
      {/* Candidate Notice */}
      {role === 'candidate' && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white/60 pointer-events-none">
          Whiteboard synced by interviewer
        </div>
      )}
    </div>
  );
};

export default DrawingBoard;
