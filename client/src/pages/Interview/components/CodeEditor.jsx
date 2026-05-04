import { Editor } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Code2,
  Terminal, Settings, X
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '~/components/ui/select';
import { useEffect, useMemo, useRef } from 'react';

const CodeEditor = ({ 
  code, language, onCodeChange, onLanguageChange, 
  onRun, isRunning, allowedLanguages,
  output, showOutput, onCloseOutput,
  theme = 'vs-dark',
  onCursorChange,
  remoteCursors,
  readOnly = false,
}) => {
  const isDark = theme && theme !== 'light';
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef({});
  const widgetsRef = useRef({});

  const cursorList = useMemo(() => {
    return Array.isArray(remoteCursors) ? remoteCursors : [];
  }, [remoteCursors]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    // Apply decorations + content widgets for remote cursors.
    cursorList.forEach((c) => {
      const role = c?.role;
      const pos = c?.position;
      const name = c?.name || (role === 'interviewer' ? 'Moderator' : 'Candidate');
      if (!role || !pos) return;

      const className = role === 'interviewer' ? 'jx-remote-caret jx-remote-caret--mod' : 'jx-remote-caret jx-remote-caret--cand';
      const labelClass = role === 'interviewer' ? 'jx-remote-label jx-remote-label--mod' : 'jx-remote-label jx-remote-label--cand';

      const lineNumber = Math.max(1, Math.min(model.getLineCount(), pos.lineNumber || 1));
      const maxCol = model.getLineMaxColumn(lineNumber);
      const column = Math.max(1, Math.min(maxCol, pos.column || 1));

      const range = new monaco.Range(lineNumber, column, lineNumber, column);
      const nextDeco = [{ range, options: { className, stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges } }];

      decorationsRef.current[role] = editor.deltaDecorations(decorationsRef.current[role] || [], nextDeco);

      // Content widget (label bubble).
      const id = `jx-remote-label-${role}`;
      if (!widgetsRef.current[role]) {
        const node = document.createElement('div');
        node.className = labelClass;
        node.textContent = name;

        const widget = {
          getId: () => id,
          getDomNode: () => node,
          getPosition: () => ({
            position: { lineNumber, column },
            preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
          }),
        };
        widgetsRef.current[role] = widget;
        editor.addContentWidget(widget);
      } else {
        const widget = widgetsRef.current[role];
        const node = widget.getDomNode();
        node.className = labelClass;
        node.textContent = name;
        
        // Update position function
        widget.getPosition = () => ({
          position: { lineNumber, column },
          preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
        });
      }

      editor.layoutContentWidget(widgetsRef.current[role]);
    });

    // Remove widgets/decorations for roles no longer present.
    const rolesPresent = new Set(cursorList.map(c => c?.role).filter(Boolean));
    Object.keys(widgetsRef.current).forEach((role) => {
      if (rolesPresent.has(role)) return;
      try {
        editor.removeContentWidget(widgetsRef.current[role]);
      } catch {
        // ignore
      }
      delete widgetsRef.current[role];
      decorationsRef.current[role] = editor.deltaDecorations(decorationsRef.current[role] || [], []);
    });
  }, [cursorList]);

  return (
    <div className={isDark ? 'h-full flex flex-col min-h-0 bg-[#0f0f14] text-white' : 'h-full flex flex-col min-h-0 bg-white'}>
      {/* Toolbar */}
      <div className={isDark ? 'flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-xl' : 'flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50'}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={isDark ? 'p-1.5 bg-emerald-500/15 text-emerald-200 rounded-xl' : 'p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg'}>
              <Code2 className="h-4 w-4" />
            </div>
            <div className={isDark ? 'text-[11px] font-black uppercase tracking-widest text-white/60' : 'text-[11px] font-black uppercase tracking-widest text-neutral-400'}>Editor</div>
          </div>
          
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className={isDark ? 'w-[140px] h-9 bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-tight rounded-2xl shadow-sm' : 'w-[140px] h-9 bg-white border border-neutral-200 text-[10px] font-black uppercase tracking-tight rounded-xl shadow-sm'}>
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className={isDark ? 'bg-[#0f0f11] border-white/10 text-white rounded-2xl' : 'bg-white border-neutral-100 text-neutral-900 rounded-xl'}>
              {allowedLanguages?.map(lang => (
                <SelectItem key={lang} value={lang} className={isDark ? 'text-[10px] uppercase font-bold focus:bg-white/10' : 'text-[10px] uppercase font-bold focus:bg-neutral-100'}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onRun}
              disabled={isRunning}
              className={`h-9 gap-2 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isRunning ? 'bg-neutral-200 text-neutral-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'}`}
            >
              {isRunning ? (
                <div className="h-3 w-3 border-2 border-neutral-400/30 border-t-neutral-400 animate-spin rounded-full" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
              {isRunning ? 'Running' : 'Run Code'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={isDark ? 'h-9 w-9 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-colors' : 'h-9 w-9 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors'}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={onCodeChange}
          theme={theme}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            const disposable = editor.onDidChangeCursorPosition((e) => {
              onCursorChange?.({ lineNumber: e.position.lineNumber, column: e.position.column });
            });

            // Cleanup when editor unmounts.
            editor.onDidDispose(() => {
              try { disposable.dispose(); } catch { /* noop */ }
            });
          }}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 20, bottom: 20 },
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            renderWhitespace: "none",
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            contextmenu: false,
            readOnly: readOnly,
          }}
        />

        {/* Console / Output Overlay */}
        <AnimatePresence>
          {showOutput && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={isDark ? 'absolute bottom-0 left-0 right-0 h-1/3 bg-[#0b0b0f] border-t border-white/10 flex flex-col z-20 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]' : 'absolute bottom-0 left-0 right-0 h-1/3 bg-white border-t border-neutral-200 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'}
            >
              <div className={isDark ? 'flex items-center justify-between px-5 py-2.5 bg-white/5 backdrop-blur-xl border-b border-white/10' : 'flex items-center justify-between px-5 py-2.5 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-100'}>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <Terminal className="h-4 w-4 text-emerald-500" />
                  Console Output
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCloseOutput}
                  className={isDark ? 'h-7 w-7 p-0 rounded-xl hover:bg-white/10 text-white/50 hover:text-white' : 'h-7 w-7 p-0 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-neutral-900'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className={isDark ? 'flex-1 p-6 font-mono text-sm overflow-y-auto bg-[#0b0b0f] text-white' : 'flex-1 p-6 font-mono text-sm overflow-y-auto bg-white'}>
                {output ? (
                  <pre className={isDark ? 'text-white/90 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30' : 'text-neutral-800 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30'}>{output}</pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-40">
                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" />
                    <div className="text-[10px] font-black uppercase tracking-widest">Executing...</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CodeEditor;
