import { Editor } from '@monaco-editor/react';
import { 
  Play, Code2,
  Terminal, Settings
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '~/components/ui/select';
import ClayIcon from './ClayIcon';

const CodeEditor = ({ 
  code, language, onCodeChange, onLanguageChange, 
  onRun, isRunning, allowedLanguages,
  output, showOutput, onCloseOutput
}) => {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ClayIcon size={34} tint="violet" className="rounded-2xl">
              <Code2 className="h-4 w-4" />
            </ClayIcon>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-neutral-400">Editor</div>
              <div className="text-xs text-neutral-500">Write, run, iterate</div>
            </div>
          </div>
          
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[160px] h-10 bg-black/30 border-white/10 text-[11px] font-black tracking-[0.14em] text-neutral-200/90 backdrop-blur-xl">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-950/90 border-white/10 text-white backdrop-blur-xl">
              {allowedLanguages?.map(lang => (
                <SelectItem key={lang} value={lang} className="text-xs focus:bg-blue-600 focus:text-white uppercase font-bold">
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
            className="h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black gap-2 px-4 font-black shadow-xl shadow-emerald-500/20"
          >
            {isRunning ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            Run Code
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-neutral-400 hover:text-white hover:bg-white/[0.06]">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0 relative group">
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
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            roundedSelection: true,
            renderWhitespace: "none",
          }}
        />

        {/* Console / Output Overlay */}
        {showOutput && (
          <div className="absolute bottom-3 left-3 right-3 h-1/3 rounded-3xl bg-black/70 backdrop-blur-2xl border border-white/10 flex flex-col z-10 transition-all duration-300 animate-in slide-in-from-bottom shadow-2xl shadow-black/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-black/30 border-b border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                <Terminal className="h-3 w-3" />
                Execution Results
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCloseOutput}
                className="h-7 rounded-xl text-[10px] font-black tracking-[0.18em] text-neutral-400 hover:text-white hover:bg-white/[0.06]"
              >
                Clear Console
              </Button>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
              {output ? (
                <pre className="text-neutral-300 leading-relaxed">{output}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-700 text-xs italic">
                  Running your code...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
