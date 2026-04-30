import { useState, useEffect, useRef, useCallback } from 'react';

export const useInterviewState = (initialData, socketHandlers, apiHandlers) => {
  const [code, setCode] = useState(initialData?.state?.code || '');
  const [language, setLanguage] = useState(initialData?.state?.language || 'cpp');
  const [activeProblem, setActiveProblem] = useState(null);
  
  const lastEmittedCode = useRef(code);
  const saveTimeout = useRef(null);

  // Sync from socket
  useEffect(() => {
    if (!socketHandlers?.on) return;

    const cleanupCode = socketHandlers.on('code-updated', (data) => {
      if (data.code !== undefined) {
        setCode(data.code);
        lastEmittedCode.current = data.code;
      }
    });

    const cleanupLang = socketHandlers.on('language-changed', (data) => {
      if (data.language) setLanguage(data.language);
    });

    const cleanupProblem = socketHandlers.on('problem-switched', (data) => {
      if (data.problem) setActiveProblem(data.problem);
      if (data.starterCode) setCode(data.starterCode);
    });

    return () => {
      cleanupCode();
      cleanupLang();
      cleanupProblem();
    };
  }, [socketHandlers]);

  // Handle local code changes
  const updateCode = useCallback((newCode) => {
    setCode(newCode);
    
    // 1. Instant sync via Socket
    if (newCode !== lastEmittedCode.current) {
      socketHandlers?.emit('interview-code-update', { 
        interviewId: initialData._id, 
        code: newCode 
      });
      lastEmittedCode.current = newCode;
    }

    // 2. Debounced persistence to Backend
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await apiHandlers.updateState(initialData._id, { code: newCode });
        console.log('[State] Code persisted to backend');
      } catch (err) {
        console.error('[State] Failed to persist code:', err);
      }
    }, 5000); // 5 seconds debounce
  }, [initialData._id, socketHandlers, apiHandlers]);

  const updateLanguage = useCallback(async (newLang) => {
    setLanguage(newLang);
    socketHandlers?.emit('interview-language-change', { 
      interviewId: initialData._id, 
      language: newLang 
    });
    
    try {
      await apiHandlers.updateState(initialData._id, { language: newLang });
    } catch (err) {
      console.error('[State] Failed to update language:', err);
    }
  }, [initialData._id, socketHandlers, apiHandlers]);

  return {
    code,
    setCode: updateCode,
    language,
    setLanguage: updateLanguage,
    activeProblem,
    setActiveProblem
  };
};

export default useInterviewState;
