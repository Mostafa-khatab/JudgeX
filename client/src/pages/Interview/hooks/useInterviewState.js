import { useState, useEffect, useRef, useCallback } from 'react';

export const useInterviewState = (initialData, socketHandlers, apiHandlers) => {
  const [code, setCode] = useState(initialData?.state?.code || '');
  const [language, setLanguage] = useState(initialData?.state?.language || 'cpp');
  const [activeProblem, setActiveProblem] = useState(null);
  
  const lastEmittedCode = useRef(code);
  const saveTimeout = useRef(null);

  // When interview changes (join/refresh), sync state from server.
  useEffect(() => {
    const nextCode = initialData?.state?.code || '';
    const nextLang = initialData?.state?.language || 'cpp';

    setCode(nextCode);
    lastEmittedCode.current = nextCode;
    setLanguage(nextLang);

    if (activeId && initialData?.questions?.length) {
      const matched = initialData.questions.find(q => 
        (q.problemId?._id || q.problemId) === activeId || q._id === activeId
      );
      
      if (matched) {
        setActiveProblem(matched.isCustom ? { ...matched.customContent, _id: matched._id, isCustom: true } : matched.problemId);
      } else {
        setActiveProblem(visibleQuestion?.isCustom ? { ...visibleQuestion.customContent, _id: visibleQuestion._id, isCustom: true } : visibleQuestion?.problemId || null);
      }
    } else {
      setActiveProblem(visibleQuestion?.isCustom ? { ...visibleQuestion.customContent, _id: visibleQuestion._id, isCustom: true } : visibleQuestion?.problemId || null);
    }
  }, [initialData?._id]);

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
        interviewId: initialData?._id, 
        code: newCode 
      });
      lastEmittedCode.current = newCode;
    }

    // 2. Debounced persistence to Backend
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        if (initialData?._id) {
          await apiHandlers.updateState(initialData._id, { code: newCode });
          console.log('[State] Code persisted to backend');
        }
      } catch (err) {
        console.error('[State] Failed to persist code:', err);
      }
    }, 5000); // 5 seconds debounce
  }, [initialData?._id, socketHandlers, apiHandlers]);

  const updateLanguage = useCallback(async (newLang) => {
    setLanguage(newLang);
    socketHandlers?.emit('interview-language-change', { 
      interviewId: initialData?._id, 
      language: newLang 
    });
    
    try {
      if (initialData?._id) {
        await apiHandlers.updateState(initialData._id, { language: newLang });
      }
    } catch (err) {
      console.error('[State] Failed to update language:', err);
    }
  }, [initialData?._id, socketHandlers, apiHandlers]);

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
