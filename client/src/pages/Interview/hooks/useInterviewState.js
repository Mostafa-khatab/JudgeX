import { useState, useEffect, useRef, useCallback } from 'react';

export const useInterviewState = (initialData, socketHandlers, apiHandlers) => {
  const [code, setCode] = useState(initialData?.state?.code || '');
  const [language, setLanguage] = useState(initialData?.state?.language || 'cpp');
  const [activeProblem, setActiveProblem] = useState(null);
  const [whiteboardData, setWhiteboardData] = useState(initialData?.state?.whiteboardData || null);
  
  const lastEmittedCode = useRef(code);
  const saveTimeout = useRef(null);

  // When interview changes (join/refresh), sync state from server.
  useEffect(() => {
    const nextCode = initialData?.state?.code || '';
    const nextLang = initialData?.state?.language || 'cpp';
    const nextWhiteboardData = initialData?.state?.whiteboardData || null;

    setCode(nextCode);
    lastEmittedCode.current = nextCode;
    setLanguage(nextLang);
    setWhiteboardData(nextWhiteboardData);
    
    const currentActiveProblemId = initialData?.state?.activeProblemId;
    const visibleQuestion = initialData?.questions?.find(q => q?.isVisible);

    if (currentActiveProblemId && initialData?.questions?.length) {
      const matched = initialData.questions.find(q => 
        (q.problemId?._id || q.problemId) === currentActiveProblemId || q._id === currentActiveProblemId
      );
      
      if (matched) {
        setActiveProblem(matched.isCustom ? { ...matched.customContent, _id: matched._id, isCustom: true } : matched.problemId);
      } else {
        setActiveProblem(visibleQuestion?.isCustom ? { ...visibleQuestion.customContent, _id: visibleQuestion._id, isCustom: true } : visibleQuestion?.problemId || null);
      }
    } else {
      setActiveProblem(visibleQuestion?.isCustom ? { ...visibleQuestion.customContent, _id: visibleQuestion._id, isCustom: true } : visibleQuestion?.problemId || null);
    }
  }, [initialData?._id, initialData?.state?.activeProblemId]);

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

    const cleanupWhiteboard = socketHandlers.on('whiteboard-updated', (data) => {
      setWhiteboardData(data);
    });

    return () => {
      cleanupCode();
      cleanupLang();
      cleanupProblem();
      cleanupWhiteboard();
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

  const updateWhiteboard = useCallback((newData) => {
    setWhiteboardData(newData);
    socketHandlers?.emit('interview-whiteboard-update', {
      interviewId: initialData?._id,
      whiteboardData: newData
    });
    // Also persist this state to the backend, maybe debounced
  }, [initialData?._id, socketHandlers]);

  return {
    code,
    setCode: updateCode,
    language,
    setLanguage: updateLanguage,
    activeProblem,
    setActiveProblem,
    whiteboardData,
    setWhiteboardData: updateWhiteboard,
  };
};

export default useInterviewState;
