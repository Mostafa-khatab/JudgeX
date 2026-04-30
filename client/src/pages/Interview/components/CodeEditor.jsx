import { Editor } from '@monaco-editor/react';
import { 
  Play, Code2, ChevronDown, 
  Terminal, Settings, Maximize2 
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
    <div className="h-full flex flex-col bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
      {/* Toolbar */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">Code Editor</span>
          </div>
          
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[140px] h-9 bg-neutral-950 border-neutral-800 text-xs font-medium focus:ring-1 ring-blue-500/50">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
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
            className="bg-green-600 hover:bg-green-700 text-white gap-2 px-4 font-bold shadow-lg shadow-green-500/20 h-9"
          >
            {isRunning ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            Run Code
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-neutral-800">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative group">
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
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/90 backdrop-blur-xl border-t border-neutral-800 flex flex-col z-10 transition-all duration-300 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/50 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                <Terminal className="h-3 w-3" />
                Execution Results
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCloseOutput}
                className="h-6 text-[10px] text-neutral-500 hover:text-white"
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
