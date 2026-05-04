import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { Button } from '~/components/ui/button';
import { PenTool, Eraser, Trash2, Send, Undo2, Redo2 } from 'lucide-react';

// Safe wrapper to prevent react-sketch-canvas errors from crashing the whole app
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('[DrawingBoard] Canvas error caught:', error.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-white/40 text-sm">
          <span>Whiteboard failed to load. <button className="underline text-blue-400" onClick={() => this.setState({ hasError: false })}>Retry</button></span>
        </div>
      );
    }
    return this.props.children;
  }
}

const safeLoadPaths = (canvasRef, data, isRemoteChangeRef) => {
  if (!canvasRef?.current || !data) return;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (Array.isArray(parsed)) {
      if (isRemoteChangeRef) isRemoteChangeRef.current = true;
      canvasRef.current.loadPaths(parsed);
      // Wait for React to process the change before releasing the guard
      setTimeout(() => {
        if (isRemoteChangeRef) isRemoteChangeRef.current = false;
      }, 50);
    }
  } catch (err) {
    console.warn('[DrawingBoard] Failed to load paths:', err.message);
    if (isRemoteChangeRef) isRemoteChangeRef.current = false;
  }
};

const DrawingBoard = forwardRef(({ problemId, drawingData, onSync, onClear, role, on, emit, interviewId, visible }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isEraser, setIsEraser] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});

  const lastSyncedDataRef = useRef(null);
  const isProcessingRemoteChangeRef = useRef(false);
  const lastEmitTimeRef = useRef(0);

  const handleSync = async () => {
    if (!canvasRef.current || role !== 'interviewer') return;
    try {
      const paths = await canvasRef.current.exportPaths();
      const stringified = JSON.stringify(paths);
      lastSyncedDataRef.current = stringified; // Track what we just sent
      emit('whiteboard-draw', { interviewId, problemId, drawingData: stringified });
      onSync?.(stringified);
      setHasUnsyncedChanges(false);
    } catch (err) {
      console.error(err);
    }
  };

  useImperativeHandle(ref, () => ({
    sync: handleSync
  }));

  // Load initial data and handle visibility changes
  useEffect(() => {
    if (visible && canvasRef.current && drawingData) {
      // Don't reload if this is the data we just synced ourselves
      if (drawingData === lastSyncedDataRef.current) {
        return;
      }

      const timer = setTimeout(() => {
        try {
          safeLoadPaths(canvasRef, drawingData, isProcessingRemoteChangeRef);
          lastSyncedDataRef.current = drawingData;
        } catch (err) {
          console.warn('[DrawingBoard] Load failed, retrying...', err.message);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [drawingData, visible]);

  // Listen for socket updates
  useEffect(() => {
    if (!on) return;
    const cleanupDraw = on('whiteboard-draw', (data) => {
      if (data.problemId === problemId && canvasRef.current && data.drawingData) {
        // Prevent echo if we just received our own update via a slow socket path (though usually socket.to avoids this)
        if (data.drawingData === lastSyncedDataRef.current) return;
        safeLoadPaths(canvasRef, data.drawingData, isProcessingRemoteChangeRef);
      }
    });
    
    const cleanupClear = on('whiteboard-clear', (data) => {
      if (data.problemId === problemId && canvasRef.current) {
        try { canvasRef.current.clearCanvas(); } catch {}
      }
    });

    const cleanupCursor = on('whiteboard-cursor-updated', (data) => {
      if (data.problemId === problemId && data.role !== role) {
        setRemoteCursors(prev => ({
          ...prev,
          [data.role]: { ...data, timestamp: Date.now() }
        }));
      }
    });

    return () => {
      cleanupDraw();
      cleanupClear();
      cleanupCursor();
    };
  }, [on, problemId, role]);

  const handleMouseMove = (e) => {
    if (!containerRef.current || !emit || !visible) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    emit('whiteboard-cursor-move', { 
      interviewId, 
      problemId, 
      role, 
      name: role === 'interviewer' ? 'Moderator' : (localStorage.getItem('candidateName') || 'Candidate'),
      x, y 
    });
  };

  const handleClear = () => {
    if (canvasRef.current) {
      try { canvasRef.current.clearCanvas(); } catch {}
      setHasUnsyncedChanges(true);
      if (role === 'interviewer' || role === 'candidate') {
        emit('whiteboard-clear', { interviewId, problemId });
        onClear?.();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f14] rounded-2xl border border-white/10 overflow-hidden">
      {/* Toolbar - Visible to both for collaboration */}
      {(role === 'interviewer' || role === 'candidate') && (
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
          </div>
        </div>
      )}
      
      {/* Canvas */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="flex-1 relative cursor-crosshair overflow-hidden"
      >
        <CanvasErrorBoundary>
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
            canvasColor="transparent"
            className="absolute inset-0 w-full h-full"
            onChange={async () => {
              // Ignore changes triggered by remote sync
              if (isProcessingRemoteChangeRef.current) return;
              
              if (canvasRef.current) {
                // Throttle emits to every 100ms
                const now = Date.now();
                if (now - lastEmitTimeRef.current < 100) return;
                lastEmitTimeRef.current = now;

                const paths = await canvasRef.current.exportPaths();
                const stringified = JSON.stringify(paths);
                lastSyncedDataRef.current = stringified;
                emit('whiteboard-draw', { interviewId, problemId, drawingData: stringified });
              }
            }}
          />
        </CanvasErrorBoundary>

        {/* Remote Cursors */}
        {Object.values(remoteCursors).map((cur) => (
          <div 
            key={cur.role}
            className="absolute pointer-events-none transition-all duration-75 z-50"
            style={{ left: `${cur.x * 100}%`, top: `${cur.y * 100}%` }}
          >
            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${cur.role === 'interviewer' ? 'bg-blue-500' : 'bg-purple-500'}`} />
            <div className="absolute left-4 top-0 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-black text-white whitespace-nowrap">
              {cur.name}
            </div>
          </div>
        ))}
      </div>
      
      {/* Candidate Notice */}
      {role === 'candidate' && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white/60 pointer-events-none">
          Whiteboard synced by interviewer
        </div>
      )}
    </div>
  );
});

export default DrawingBoard;
