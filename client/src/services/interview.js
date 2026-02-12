import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_URL}/interview`,
  withCredentials: true,
});

// Add candidate token to requests if available
api.interceptors.request.use((config) => {
  const candidateToken = localStorage.getItem('candidateToken');
  if (candidateToken) {
    config.headers['x-candidate-token'] = candidateToken;
  }
  return config;
});

// ==================== INSTRUCTOR API ====================

/**
 * Create a new interview
 */
export const createInterview = async (data) => {
  const response = await api.post('/', data);
  return response.data;
};

/**
 * Get all my interviews (instructor)
 */
export const getMyInterviews = async (status = null) => {
  const params = status ? { status } : {};
  const response = await api.get('/', { params });
  return response.data;
};

/**
 * Get interview details
 */
export const getInterview = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

/**
 * Update interview
 */
export const updateInterview = async (id, data) => {
  const response = await api.put(`/${id}`, data);
  return response.data;
};

/**
 * Delete interview
 */
export const deleteInterview = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

// ==================== QUESTION MANAGEMENT ====================

/**
 * Search problems for adding to interview
 */
export const searchProblems = async (params) => {
  const response = await api.get('/problems/search', { params });
  return response.data;
};

/**
 * Add question to interview
 */
export const addQuestion = async (interviewId, data) => {
  const response = await api.post(`/${interviewId}/questions`, data);
  return response.data;
};

/**
 * Remove question from interview
 */
export const removeQuestion = async (interviewId, problemId) => {
  const response = await api.delete(`/${interviewId}/questions/${problemId}`);
  return response.data;
};

/**
 * Update question settings
 */
export const updateQuestionSettings = async (interviewId, problemId, data) => {
  const response = await api.put(`/${interviewId}/questions/${problemId}`, data);
  return response.data;
};

// ==================== LIFECYCLE MANAGEMENT ====================

/**
 * Start interview
 */
export const startInterview = async (id) => {
  const response = await api.post(`/${id}/start`);
  return response.data;
};

/**
 * Pause interview
 */
export const pauseInterview = async (id) => {
  const response = await api.post(`/${id}/pause`);
  return response.data;
};

/**
 * Resume interview
 */
export const resumeInterview = async (id) => {
  const response = await api.post(`/${id}/resume`);
  return response.data;
};

/**
 * End interview
 */
export const endInterview = async (id) => {
  const response = await api.post(`/${id}/end`);
  return response.data;
};

// ==================== CANDIDATE API ====================

/**
 * Join interview via invite token
 */
export const joinInterview = async (token, candidateInfo = {}) => {
  const params = new URLSearchParams(candidateInfo).toString();
  const response = await api.get(`/join/${token}?${params}`);
  
  // Store candidate token for future requests
  if (response.data.candidateToken) {
    localStorage.setItem('candidateToken', response.data.candidateToken);
  }
  
  return response.data;
};

/**
 * Get problem details for interview
 */
export const getProblemForInterview = async (interviewId, problemId) => {
  const response = await api.get(`/${interviewId}/problems/${problemId}`);
  return response.data;
};

// ==================== SUBMISSIONS ====================

/**
 * Get all submissions for interview
 */
export const getSubmissions = async (interviewId) => {
  const response = await api.get(`/${interviewId}/submissions`);
  return response.data;
};

/**
 * Get interview results
 */
export const getResults = async (interviewId) => {
  const response = await api.get(`/${interviewId}/results`);
  return response.data;
};

// ==================== NOTES & RUBRICS ====================

/**
 * Update instructor notes
 */
export const updateNotes = async (interviewId, notes) => {
  const response = await api.post(`/${interviewId}/notes`, { notes });
  return response.data;
};

/**
 * Add rubric evaluation
 */
export const addRubric = async (interviewId, rubric) => {
  const response = await api.post(`/${interviewId}/rubrics`, rubric);
  return response.data;
};

/**
 * Update final feedback
 */
export const updateFeedback = async (interviewId, feedback) => {
  const response = await api.post(`/${interviewId}/feedback`, { feedback });
  return response.data;
};

/**
 * Add custom question to interview
 */
export const addCustomQuestion = async (interviewId, data) => {
  const response = await api.post(`/${interviewId}/custom-problem`, data);
  return response.data;
};

/**
 * Send chat message
 */
export const sendMessage = async (interviewId, data) => {
  const response = await api.post(`/${interviewId}/messages`, data);
  return response.data;
};

/**
 * Record candidate event
 */
export const recordEvent = async (interviewId, data) => {
  const response = await api.post(`/${interviewId}/events`, data);
  return response.data;
};

// ==================== SOCKET HELPERS ====================

/**
 * Get socket event handlers for interview
 */
export const getInterviewSocketEvents = (socket, interviewId, callbacks) => {
  // Join interview room
  const join = (role, name) => {
    socket.emit('join-interview', { interviewId, role, name });
  };

  // Leave interview room
  const leave = () => {
    socket.emit('leave-interview', { interviewId });
  };

  // Send code update (candidate)
  const sendCodeUpdate = (code, problemId, language) => {
    socket.emit('interview-code-update', { interviewId, code, problemId, language });
  };

  // Send submission notification
  const sendSubmission = (problemId, status) => {
    socket.emit('interview-submission', { interviewId, problemId, status });
  };

  // Send question switch notification
  const sendQuestionSwitch = (problemId) => {
    socket.emit('interview-question-switch', { interviewId, problemId });
  };

  // Send chat message
  const sendChatMessage = (role, content) => {
    socket.emit('interview-chat-message', { interviewId, role, content });
  };

  // Send paste event
  const sendPasteEvent = (problemId, contentLength) => {
    socket.emit('interview-paste-event', { interviewId, problemId, contentLength });
  };

  // Send focus event
  const sendFocusEvent = (type) => {
    socket.emit('interview-focus-event', { interviewId, type });
  };

  // Send status update
  const sendStatusUpdate = (status, remainingTime) => {
    socket.emit('interview-status-update', { interviewId, status, remainingTime });
  };

  // Send problem update
  const sendProblemUpdate = (type, problemId, problemData) => {
    socket.emit('interview-problem-update', { interviewId, type, problemId, problemData });
  };

  // Subscribe to events
  const subscribe = () => {
    if (callbacks.onParticipantJoined) {
      socket.on('participant-joined', callbacks.onParticipantJoined);
    }
    if (callbacks.onParticipantLeft) {
      socket.on('participant-left', callbacks.onParticipantLeft);
    }
    if (callbacks.onCodeUpdated) {
      socket.on('code-updated', callbacks.onCodeUpdated);
    }
    if (callbacks.onSubmissionMade) {
      socket.on('submission-made', callbacks.onSubmissionMade);
    }
    if (callbacks.onQuestionSwitched) {
      socket.on('question-switched', callbacks.onQuestionSwitched);
    }
    if (callbacks.onChatMessage) {
      socket.on('chat-message', callbacks.onChatMessage);
    }
    if (callbacks.onPasteDetected) {
      socket.on('paste-detected', callbacks.onPasteDetected);
    }
    if (callbacks.onFocusUpdated) {
      socket.on('focus-updated', callbacks.onFocusUpdated);
    }
    if (callbacks.onStatusUpdated) {
      socket.on('status-updated', callbacks.onStatusUpdated);
    }
    if (callbacks.onProblemUpdated) {
      socket.on('problem-updated', callbacks.onProblemUpdated);
    }
    if (callbacks.onInterviewStarted) {
      socket.on('interviewStarted', callbacks.onInterviewStarted);
    }
    if (callbacks.onInterviewPaused) {
      socket.on('interviewPaused', callbacks.onInterviewPaused);
    }
    if (callbacks.onInterviewResumed) {
      socket.on('interviewResumed', callbacks.onInterviewResumed);
    }
    if (callbacks.onInterviewEnded) {
      socket.on('interviewEnded', callbacks.onInterviewEnded);
    }
    if (callbacks.onQuestionUpdated) {
      socket.on('questionUpdated', callbacks.onQuestionUpdated);
    }
  };

  // Unsubscribe from events
  const unsubscribe = () => {
    socket.off('participant-joined');
    socket.off('participant-left');
    socket.off('code-updated');
    socket.off('submission-made');
    socket.off('question-switched');
    socket.off('chat-message');
    socket.off('paste-detected');
    socket.off('focus-updated');
    socket.off('status-updated');
    socket.off('problem-updated');
    socket.off('interviewStarted');
    socket.off('interviewPaused');
    socket.off('interviewResumed');
    socket.off('interviewEnded');
    socket.off('questionUpdated');
  };

  return {
    join,
    leave,
    sendCodeUpdate,
    sendSubmission,
    sendQuestionSwitch,
    sendChatMessage,
    sendPasteEvent,
    sendFocusEvent,
    sendStatusUpdate,
    sendProblemUpdate,
    subscribe,
    unsubscribe,
  };
};

export default {
  createInterview,
  getMyInterviews,
  getInterview,
  updateInterview,
  deleteInterview,
  searchProblems,
  addQuestion,
  removeQuestion,
  updateQuestionSettings,
  startInterview,
  pauseInterview,
  resumeInterview,
  endInterview,
  joinInterview,
  getProblemForInterview,
  getSubmissions,
  getResults,
  updateNotes,
  addRubric,
  updateFeedback,
  addCustomQuestion,
  sendMessage,
  recordEvent,
  getInterviewSocketEvents,
};
