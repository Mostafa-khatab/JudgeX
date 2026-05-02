import { Editor } from '@monaco-editor/react';
import { 
  Play, Code2,
  Terminal, Settings, X
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '~/components/ui/select';

const CodeEditor = ({ 
  code, language, onCodeChange, onLanguageChange, 
  onRun, isRunning, allowedLanguages,
  output, showOutput, onCloseOutput
}) => {
  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-[#0f0f11]">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-neutral-200 dark:border-white/5 bg-neutral-50/50 dark:bg-[#161618]/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Editor</div>
          </div>
          
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-white/5 border-none text-[10px] font-black uppercase tracking-tight rounded-xl shadow-inner">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-xl">
              {allowedLanguages?.map(lang => (
                <SelectItem key={lang} value={lang} className="text-[10px] uppercase font-bold focus:bg-blue-600">
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onRun}
            disabled={isRunning}
            className={`h-9 gap-2 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isRunning ? 'bg-neutral-800' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'}`}
          >
            {isRunning ? (
              <div className="h-3 w-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : (
              <Play className="h-3 w-3 fill-current" />
            )}
            {isRunning ? 'Running' : 'Run Code'}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={onCodeChange}
          theme="vs-dark"
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
              className="absolute bottom-0 left-0 right-0 h-1/3 bg-white dark:bg-[#0f0f11] border-t border-neutral-200 dark:border-white/10 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50 dark:bg-[#161618]/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <Terminal className="h-4 w-4 text-emerald-500" />
                  Console Output
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCloseOutput}
                  className="h-7 w-7 p-0 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 font-mono text-sm overflow-y-auto bg-neutral-50 dark:bg-[#0a0a0b]/50">
                {output ? (
                  <pre className="text-neutral-800 dark:text-blue-100/80 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">{output}</pre>
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
