import Interview from '../models/interview.js';
import Problem from '../models/problem.js';

/**
 * Interview Controller - LeetCode-style Technical Interview Platform
 */

// ==================== CREATE ====================
/**
 * Create a new interview
 * POST /interview/
 */
const createInterview = async (req, res) => {
  try {
    const { title, type, duration, description, allowedLanguages, scheduledAt, questions } = req.body;
    
    if (!title || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Title and duration are required'
      });
    }
    
    // Process questions if provided
    let processedQuestions = [];
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        if (q.problemId) {
          const problem = await Problem.findById(q.problemId);
          if (problem) {
            processedQuestions.push({
              problemId: problem._id,
              problemName: problem.name,
              problemDifficulty: problem.difficulty,
              isVisible: false,
              isCustom: false
            });
          }
        } else if (q.customContent) {
          processedQuestions.push({
            isCustom: true,
            isVisible: false,
            customContent: q.customContent
          });
        }
      }
    }
    
    const interview = new Interview({
      title,
      type: type || 'technical',
      duration,
      description: description || '',
      allowedLanguages: allowedLanguages || ['cpp', 'python', 'javascript', 'java'],
      scheduledAt: scheduledAt || null,
      instructor: req.userId,
      questions: processedQuestions,
      state: {
        code: '// Start coding here...\n',
        language: allowedLanguages?.[0] || 'cpp',
        remainingTime: duration * 60
      }
    });
    
    await interview.save();
    
    res.status(201).json({
      success: true,
      data: interview,
      inviteLink: `${process.env.CLIENT_URL}/interview/join/${interview.inviteToken}`
    });
  } catch (err) {
    console.error('Create interview error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create interview'
    });
  }
};

// ==================== GET ALL ====================
/**
 * Get all interviews for instructor
 * GET /interview/
 */
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ instructor: req.userId })
      .sort({ createdAt: -1 })
      .select('-messages -snapshots -events -feedback')
      .lean();
    
    res.json({
      success: true,
      data: interviews
    });
  } catch (err) {
    console.error('Get interviews error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get interviews'
    });
  }
};

// ==================== GET ONE ====================
/**
 * Get interview by ID
 * GET /interview/:id
 */
const getInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateToken = req.headers['x-candidate-token'];
    
    const interview = await Interview.findById(id)
      .populate('instructor', 'username avatar')
      .populate('questions.problemId', 'name difficulty description examples constraints')
      .lean();
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Determine role
    const isInstructor = req.userId && interview.instructor._id.toString() === req.userId.toString();
    const isCandidate = candidateToken && interview.inviteToken === candidateToken;
    
    if (!isInstructor && !isCandidate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Filter data based on role
    let responseData = { ...interview };
    
    if (!isInstructor) {
      // Hide feedback, snapshots, and non-visible questions from candidate
      delete responseData.feedback;
      delete responseData.snapshots;
      delete responseData.events;
      responseData.questions = responseData.questions.filter(q => q.isVisible);
    }
    
    res.json({
      success: true,
      data: responseData,
      role: isInstructor ? 'interviewer' : 'candidate'
    });
  } catch (err) {
    console.error('Get interview error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview'
    });
  }
};

// ==================== JOIN ====================
/**
 * Join interview via invite token
 * GET /interview/join/:token
 */
const joinInterview = async (req, res) => {
  try {
    const { token } = req.params;
    const { name, email } = req.query;
    
    const interview = await Interview.findOne({ inviteToken: token });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found or invalid token'
      });
    }
    
    if (interview.status === 'finished' || interview.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This interview has already ended'
      });
    }
    
    // Update candidate info
    if (name) interview.candidate.name = name;
    if (email) interview.candidate.email = email;
    interview.candidate.joinedAt = new Date();
    interview.candidate.isConnected = true;
    
    await interview.save();
    
    // Return interview data (filtered for candidate)
    const responseData = {
      _id: interview._id,
      title: interview.title,
      type: interview.type,
      duration: interview.duration,
      status: interview.status,
      state: interview.state,
      allowedLanguages: interview.allowedLanguages,
      questions: interview.questions.filter(q => q.isVisible),
      messages: interview.messages
    };
    
    res.json({
      success: true,
      data: responseData,
      candidateToken: token,
      role: 'candidate'
    });
  } catch (err) {
    console.error('Join interview error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to join interview'
    });
  }
};

// ==================== START ====================
/**
 * Start interview
 * POST /interview/:id/start
 */
const startInterview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can start' });
    }
    
    interview.status = 'active';
    interview.startedAt = new Date();
    interview.state.remainingTime = interview.duration * 60;
    
    await interview.save();
    
    res.json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ success: false, message: 'Failed to start interview' });
  }
};

// ==================== PAUSE ====================
/**
 * Pause interview
 * POST /interview/:id/pause
 */
const pauseInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { remainingTime } = req.body;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can pause' });
    }
    
    interview.status = 'paused';
    if (remainingTime !== undefined) {
      interview.state.remainingTime = remainingTime;
    }
    
    await interview.save();
    
    res.json({ success: true, data: interview });
  } catch (err) {
    console.error('Pause interview error:', err);
    res.status(500).json({ success: false, message: 'Failed to pause interview' });
  }
};

// ==================== RESUME ====================
/**
 * Resume interview
 * POST /interview/:id/resume
 */
const resumeInterview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can resume' });
    }
    
    interview.status = 'active';
    await interview.save();
    
    res.json({ success: true, data: interview });
  } catch (err) {
    console.error('Resume interview error:', err);
    res.status(500).json({ success: false, message: 'Failed to resume interview' });
  }
};

// ==================== END ====================
/**
 * End interview
 * POST /interview/:id/end
 */
const endInterview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can end' });
    }
    
    // Take final snapshot
    await interview.addSnapshot(
      interview.state.code,
      interview.state.language,
      interview.state.activeProblemId,
      'Final snapshot at interview end',
      true
    );
    
    interview.status = 'finished';
    interview.endedAt = new Date();
    
    await interview.save();
    
    res.json({ success: true, data: interview });
  } catch (err) {
    console.error('End interview error:', err);
    res.status(500).json({ success: false, message: 'Failed to end interview' });
  }
};

// ==================== UPDATE STATE ====================
/**
 * Update shared state (code, language, active problem)
 * POST /interview/:id/state
 */
const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language, activeProblemId, remainingTime, cursorPosition } = req.body;
    const candidateToken = req.headers['x-candidate-token'];
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    // Verify access
    const isInstructor = req.userId && interview.instructor.toString() === req.userId.toString();
    const isCandidate = candidateToken && interview.inviteToken === candidateToken;
    
    if (!isInstructor && !isCandidate) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Update state
    if (code !== undefined) interview.state.code = code;
    if (language !== undefined) {
      if (!interview.allowedLanguages.includes(language)) {
        return res.status(400).json({ success: false, message: 'Language not allowed' });
      }
      interview.state.language = language;
      interview.events.push({ type: 'language-changed', details: { language } });
    }
    if (activeProblemId !== undefined && isInstructor) {
      interview.state.activeProblemId = activeProblemId;
      // Make the problem visible to candidate
      const qIndex = interview.questions.findIndex(q => q.problemId?.toString() === activeProblemId);
      if (qIndex !== -1) {
        interview.questions[qIndex].isVisible = true;
      }
      interview.events.push({ type: 'problem-changed', details: { problemId: activeProblemId } });
    }
    if (remainingTime !== undefined && isInstructor) {
      interview.state.remainingTime = remainingTime;
    }
    if (cursorPosition) {
      const role = isInstructor ? 'interviewer' : 'candidate';
      interview.state.cursorPositions[role] = cursorPosition;
    }
    
    await interview.save();
    
    res.json({ success: true, data: interview.state });
  } catch (err) {
    console.error('Update state error:', err);
    res.status(500).json({ success: false, message: 'Failed to update state' });
  }
};

// ==================== ADD MESSAGE ====================
/**
 * Add chat message
 * POST /interview/:id/messages
 */
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, role } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content required' });
    }
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    interview.messages.push({
      role: role || 'candidate',
      content,
      timestamp: new Date()
    });
    
    await interview.save();
    
    res.json({ success: true, message: interview.messages[interview.messages.length - 1] });
  } catch (err) {
    console.error('Add message error:', err);
    res.status(500).json({ success: false, message: 'Failed to add message' });
  }
};

// ==================== SAVE FEEDBACK ====================
/**
 * Save private feedback (interviewer only)
 * POST /interview/:id/feedback
 */
const saveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { problemSolving, communication, codingStyle, technicalKnowledge, overallNotes, recommendation } = req.body;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can save feedback' });
    }
    
    if (problemSolving) interview.feedback.problemSolving = problemSolving;
    if (communication) interview.feedback.communication = communication;
    if (codingStyle) interview.feedback.codingStyle = codingStyle;
    if (technicalKnowledge) interview.feedback.technicalKnowledge = technicalKnowledge;
    if (overallNotes !== undefined) interview.feedback.overallNotes = overallNotes;
    if (recommendation) interview.feedback.recommendation = recommendation;
    
    await interview.save();
    
    res.json({ success: true, data: interview.feedback });
  } catch (err) {
    console.error('Save feedback error:', err);
    res.status(500).json({ success: false, message: 'Failed to save feedback' });
  }
};

// ==================== TAKE SNAPSHOT ====================
/**
 * Take code snapshot
 * POST /interview/:id/snapshot
 */
const takeSnapshot = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can take snapshots' });
    }
    
    await interview.addSnapshot(
      interview.state.code,
      interview.state.language,
      interview.state.activeProblemId,
      note || '',
      false // manual snapshot
    );
    
    res.json({ 
      success: true, 
      snapshot: interview.snapshots[interview.snapshots.length - 1] 
    });
  } catch (err) {
    console.error('Take snapshot error:', err);
    res.status(500).json({ success: false, message: 'Failed to take snapshot' });
  }
};

// ==================== TRACK TAB SWITCH ====================
/**
 * Track tab switch event
 * POST /interview/:id/tab-switch
 */
const trackTabSwitch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    await interview.incrementTabSwitch();
    
    res.json({ 
      success: true, 
      tabSwitchCount: interview.tabSwitchCount 
    });
  } catch (err) {
    console.error('Track tab switch error:', err);
    res.status(500).json({ success: false, message: 'Failed to track event' });
  }
};

// ==================== GET RESULTS ====================
/**
 * Get interview results (interviewer only)
 * GET /interview/:id/results
 */
const getResults = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findById(id)
      .populate('instructor', 'username')
      .populate('questions.problemId', 'name difficulty')
      .lean();
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can view results' });
    }
    
    res.json({
      success: true,
      data: {
        ...interview,
        totalScore: interview.feedback ? 
          [
            interview.feedback.problemSolving?.score,
            interview.feedback.communication?.score,
            interview.feedback.codingStyle?.score,
            interview.feedback.technicalKnowledge?.score
          ].filter(s => s).reduce((a, b) => a + b, 0) / 
          [
            interview.feedback.problemSolving?.score,
            interview.feedback.communication?.score,
            interview.feedback.codingStyle?.score,
            interview.feedback.technicalKnowledge?.score
          ].filter(s => s).length || null : null
      }
    });
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ success: false, message: 'Failed to get results' });
  }
};

// ==================== DELETE ====================
/**
 * Delete interview
 * DELETE /interview/:id
 */
const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only creator can delete' });
    }
    
    await Interview.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) {
    console.error('Delete interview error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete interview' });
  }
};

// ==================== ADD QUESTION ====================
/**
 * Add question to interview
 * POST /interview/:id/questions
 */
const addQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { problemId, customContent } = req.body;
    
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (interview.instructor.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only interviewer can add questions' });
    }
    
    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (!problem) {
        return res.status(404).json({ success: false, message: 'Problem not found' });
      }
      interview.questions.push({
        problemId: problem._id,
        problemName: problem.name,
        problemDifficulty: problem.difficulty,
        isVisible: false,
        isCustom: false
      });
    } else if (customContent) {
      interview.questions.push({
        isCustom: true,
        isVisible: false,
        customContent
      });
    }
    
    await interview.save();
    
    res.json({ success: true, data: interview.questions });
  } catch (err) {
    console.error('Add question error:', err);
    res.status(500).json({ success: false, message: 'Failed to add question' });
  }
};

export {
  createInterview,
  getInterviews,
  getInterview,
  joinInterview,
  startInterview,
  pauseInterview,
  resumeInterview,
  endInterview,
  updateState,
  addMessage,
  saveFeedback,
  takeSnapshot,
  trackTabSwitch,
  getResults,
  deleteInterview,
  addQuestion
};
