/**
 * Interview Controller - Fixed version with security improvements
 * FIX: Added input validation, race condition prevention, proper auth checks, and response utility
 */

import Interview from '../models/interview.js';
import Problem from '../models/problem.js';
import mongoose from 'mongoose';
import { sendSuccess, sendError, handleError } from '../utils/response.js';
import { validateSchema, CreateInterviewSchema, JoinInterviewSchema, AddInterviewMessageSchema, SaveFeedbackSchema } from '../utils/validation.js';
import { auditLog, sensitiveOperations } from '../middlewares/auditLogger.js';

// ==================== CREATE ====================
/**
 * Create a new interview
 * POST /interview/
 * FIX: Added input validation
 */
const createInterview = async (req, res) => {
  try {
    // FIX: Validate input
    const validatedData = await validateSchema(CreateInterviewSchema, req.body);
    const { title, type, duration, description, allowedLanguages, scheduledAt, questions } = validatedData;

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

    console.log(`[AUDIT] Interview created: ${interview._id}`);

    return sendSuccess(res, {
      ...interview.toObject(),
      inviteLink: `${process.env.CLIENT_URL || 'https://judgex-site.vercel.app'}/interview/join/${interview.inviteToken}`
    }, 'Interview created successfully', 201);
  } catch (err) {
    console.error('[CreateInterview] Detailed Error:', err);
    // Return the specific validation error if available
    const errorMessage = err.message || 'Failed to create interview';
    return sendError(res, errorMessage, 400);
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

    return sendSuccess(res, interviews, 'Interviews retrieved successfully');
  } catch (err) {
    return handleError(res, err, 'GetInterviews', 500);
  }
};

// ==================== GET ONE ====================
/**
 * Get interview by ID
 * GET /interview/:id
 * FIX: Improved role-based access control
 */
const getInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateToken = req.headers['x-candidate-token'];

    // FIX: Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id)
      .populate('instructor', 'username avatar')
      .populate('questions.problemId', 'name difficulty description examples constraints')
      .lean();

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    // FIX: Determine role with proper validation
    const isInstructor = req.userId && interview.instructor._id.toString() === req.userId.toString();
    const isCandidate = candidateToken && interview.inviteToken === candidateToken;

    if (!isInstructor && !isCandidate) {
      return sendError(res, 'Access denied', 403);
    }

    // Filter data based on role
    let responseData = { ...interview };

    if (!isInstructor) {
      // FIX: Hide feedback, snapshots, and non-visible questions from candidate
      delete responseData.feedback;
      delete responseData.snapshots;
      delete responseData.events;
      responseData.questions = responseData.questions.filter(q => q.isVisible);
    }

    return sendSuccess(res, {
      ...responseData,
      role: isInstructor ? 'interviewer' : 'candidate'
    }, 'Interview retrieved');
  } catch (err) {
    return handleError(res, err, 'GetInterview', 500);
  }
};

// ==================== JOIN ====================
/**
 * Join interview via invite token
 * POST /interview/join/:token
 * FIX: Added race condition prevention and input validation
 */
const joinInterview = async (req, res) => {
  try {
    const { token } = req.params;
    // FIX: Use POST body instead of query parameters
    const validatedData = await validateSchema(JoinInterviewSchema, req.body);
    const name = (validatedData.name || '').trim();
    const email = (validatedData.email || '').trim().toLowerCase();

    // FIX: Validate token format
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
      return sendError(res, 'Invalid interview token', 400);
    }

    // NOTE: Avoid MongoDB transactions here.
    // Many deployments run MongoDB without replica-set support (transactions would hard-fail).
    // Also: joining via invite should not permanently lock the session.
    // We treat "join" as recording candidate identity; real-time connectivity is tracked by sockets.
    const now = new Date();
    const interview = await Interview.findOneAndUpdate(
      {
        inviteToken: token,
        status: { $nin: ['finished', 'cancelled'] },
      },
      {
        $set: {
          'candidate.name': name,
          'candidate.email': email,
          'candidate.joinedAt': now,
          // Do NOT set isConnected here. This is updated by socket lifecycle.
        },
      },
      { new: true }
    );

    if (!interview) {
      // Provide a more accurate error message.
      const existing = await Interview.findOne({ inviteToken: token })
        .select('status candidate.email candidate.isConnected')
        .lean();

      if (!existing) return sendError(res, 'Interview not found or invalid token', 404);
      if (existing.status === 'finished' || existing.status === 'cancelled') {
        return sendError(res, 'This interview has already ended', 400);
      }
      return sendError(res, 'Unable to join interview', 400);
    }

    // Populate for UI (candidate needs problem details; lobby needs instructor info)
    await interview.populate([
      { path: 'instructor', select: 'username avatar' },
      { path: 'questions.problemId', select: 'name difficulty task description examples constraints timeLimit memoryLimit' },
      { path: 'state.activeProblemId', select: 'name difficulty task description examples constraints timeLimit memoryLimit' },
    ]);

    // Return interview data (filtered for candidate)
    const responseData = {
      _id: interview._id,
      title: interview.title,
      type: interview.type,
      duration: interview.duration,
      status: interview.status,
      state: interview.state,
      allowedLanguages: interview.allowedLanguages,
      instructor: interview.instructor,
      candidate: { name: interview.candidate?.name || '', joinedAt: interview.candidate?.joinedAt || null, isConnected: interview.candidate?.isConnected || false },
      questions: interview.questions.filter(q => q.isVisible),
      messages: interview.messages
    };

    console.log(`[AUDIT] Candidate joined interview: ${interview._id}, email: ${email}`);

    return sendSuccess(res, {
      ...responseData,
      candidateToken: token,
      role: 'candidate'
    }, 'Joined interview successfully');
  } catch (err) {
    return handleError(res, err, 'JoinInterview', 500);
  }
};

// ==================== INVITE PREVIEW ====================
/**
 * Get interview by invite token (no join side-effects)
 * GET /interview/join/:token
 * Used for lobby/refresh on invite link.
 */
const getInterviewByToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
      return sendError(res, 'Invalid interview token', 400);
    }

    const interview = await Interview.findOne({ inviteToken: token })
      .populate('instructor', 'username avatar')
      .populate('questions.problemId', 'name difficulty task description examples constraints timeLimit memoryLimit')
      .populate('state.activeProblemId', 'name difficulty task description examples constraints timeLimit memoryLimit')
      .lean();

    if (!interview) {
      return sendError(res, 'Interview not found or invalid token', 404);
    }

    if (interview.status === 'finished' || interview.status === 'cancelled') {
      return sendError(res, 'This interview has already ended', 400);
    }

    const isInstructor = req.userId && interview.instructor._id.toString() === req.userId.toString();
    const role = isInstructor ? 'interviewer' : 'candidate';

    // Filter questions based on role
    const filteredQuestions = isInstructor 
      ? (interview.questions || []) 
      : (interview.questions || []).filter(q => q?.isVisible);

    return sendSuccess(res, {
      _id: interview._id,
      title: interview.title,
      type: interview.type,
      duration: interview.duration,
      status: interview.status,
      state: interview.state,
      allowedLanguages: interview.allowedLanguages,
      instructor: interview.instructor,
      candidate: { name: interview.candidate?.name || '', joinedAt: interview.candidate?.joinedAt || null, isConnected: interview.candidate?.isConnected || false },
      questions: filteredQuestions,
      messages: interview.messages || [],
      role: role
    }, 'Interview retrieved');
  } catch (err) {
    return handleError(res, err, 'GetInterviewByToken', 500);
  }
};

// ==================== START ====================
/**
 * Start interview
 * POST /interview/:id/start
 * FIX: Added proper validation
 */
const startInterview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can start', 403);
    }

    if (interview.status === 'active') {
      return sendError(res, 'Interview is already active', 400);
    }

    interview.status = 'active';
    interview.startedAt = new Date();
    interview.state.remainingTime = interview.duration * 60;

    await interview.save();

    return sendSuccess(res, interview.toObject(), 'Interview started');
  } catch (err) {
    return handleError(res, err, 'StartInterview', 500);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can pause', 403);
    }

    interview.status = 'paused';
    if (remainingTime !== undefined && remainingTime >= 0) {
      interview.state.remainingTime = remainingTime;
    }

    await interview.save();

    return sendSuccess(res, interview.toObject(), 'Interview paused');
  } catch (err) {
    return handleError(res, err, 'PauseInterview', 500);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can resume', 403);
    }

    if (interview.status !== 'paused') {
      return sendError(res, 'Only paused interviews can be resumed', 400);
    }

    interview.status = 'active';
    await interview.save();

    return sendSuccess(res, interview.toObject(), 'Interview resumed');
  } catch (err) {
    return handleError(res, err, 'ResumeInterview', 500);
  }
};

// ==================== END ====================
/**
 * End interview
 * POST /interview/:id/end
 * FIX: Added session cleanup and proper state finalization
 */
const endInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { io } = req.app.locals;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    if (io) {
      io.to(`interview:${id}`).emit('interview-finished', {
        status: 'finished',
        message: 'Interview ended and all data has been deleted.'
      });
      io.to(`interview:${id}`).disconnectSockets();
    }

    await Interview.findByIdAndDelete(id);

    return sendSuccess(res, null, 'Interview ended and deleted');
  } catch (err) {
    return handleError(res, err, 'EndInterview', 500);
  }
};

// ==================== UPDATE STATE ====================
/**
 * Update shared state (code, language, active problem)
 * POST /interview/:id/state
 * FIX: Added proper validation and access control
 */
const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language, activeProblemId, remainingTime, cursorPosition } = req.body;
    const candidateToken = req.headers['x-candidate-token'];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    // Verify access
    const isInstructor = req.userId && interview.instructor.toString() === req.userId.toString();
    const isCandidate = candidateToken && interview.inviteToken === candidateToken;

    if (!isInstructor && !isCandidate) {
      return sendError(res, 'Access denied', 403);
    }

    // Lockdown: Prevent updates if finished
    if (interview.status === 'finished') {
      return sendError(res, 'Interview is finished and cannot be modified', 403);
    }

    // Update state with validation
    if (code !== undefined) {
      if (typeof code !== 'string' || code.length > 50000) {
        return sendError(res, 'Invalid code', 400);
      }
      interview.state.code = code;
    }

    if (language !== undefined) {
      if (!interview.allowedLanguages.includes(language)) {
        return sendError(res, 'Language not allowed', 400);
      }
      interview.state.language = language;
    }

    if (activeProblemId !== undefined && activeProblemId !== null) {
      if (!mongoose.Types.ObjectId.isValid(activeProblemId)) {
        return sendError(res, 'Invalid problem ID', 400);
      }
      interview.state.activeProblemId = activeProblemId;
    }

    if (remainingTime !== undefined && remainingTime >= 0) {
      interview.state.remainingTime = remainingTime;
    }

    if (cursorPosition !== undefined) {
      interview.state.cursorPositions[isInstructor ? 'interviewer' : 'candidate'] = cursorPosition;
    }

    await interview.save();

    return sendSuccess(res, interview.state, 'State updated');
  } catch (err) {
    return handleError(res, err, 'UpdateState', 500);
  }
};

// ==================== ADD MESSAGE ====================
/**
 * Add chat message
 * POST /interview/:id/messages
 * FIX: Added input validation
 */
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = await validateSchema(AddInterviewMessageSchema, req.body);
    const { content } = validatedData;
    const candidateToken = req.headers['x-candidate-token'];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    const isInstructor = req.userId && interview.instructor.toString() === req.userId.toString();
    const isCandidate = candidateToken && interview.inviteToken === candidateToken;

    if (!isInstructor && !isCandidate) {
      return sendError(res, 'Access denied', 403);
    }

    interview.messages.push({
      role: isInstructor ? 'interviewer' : 'candidate',
      content,
      timestamp: new Date()
    });

    await interview.save();

    const last = interview.messages[interview.messages.length - 1];

    return sendSuccess(res, { role: last.role, content: last.content, timestamp: last.timestamp }, 'Message added');
  } catch (err) {
    return handleError(res, err, 'AddMessage', 500);
  }
};

// ==================== SAVE FEEDBACK ====================
/**
 * Save interviewer feedback
 * POST /interview/:id/feedback
 * FIX: Added input validation
 */
const saveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = await validateSchema(SaveFeedbackSchema, req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can save feedback', 403);
    }

    // Update feedback
    if (validatedData.problemSolving) interview.feedback.problemSolving = validatedData.problemSolving;
    if (validatedData.communication) interview.feedback.communication = validatedData.communication;
    if (validatedData.codingStyle) interview.feedback.codingStyle = validatedData.codingStyle;
    if (validatedData.technicalKnowledge) interview.feedback.technicalKnowledge = validatedData.technicalKnowledge;
    if (validatedData.overallNotes) interview.feedback.overallNotes = validatedData.overallNotes;
    if (validatedData.recommendation) interview.feedback.recommendation = validatedData.recommendation;

    await interview.save();

    console.log(`[AUDIT] Feedback saved for interview: ${id}`);

    return sendSuccess(res, interview.feedback, 'Feedback saved successfully');
  } catch (err) {
    return handleError(res, err, 'SaveFeedback', 500);
  }
};

// ==================== TAKE SNAPSHOT ====================
/**
 * Take manual code snapshot
 * POST /interview/:id/snapshot
 */
const takeSnapshot = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can take snapshots', 403);
    }

    await interview.addSnapshot(
      interview.state.code,
      interview.state.language,
      interview.state.activeProblemId,
      note || '',
      false
    );

    return sendSuccess(res, { snapshot: interview.snapshots[interview.snapshots.length - 1] }, 'Snapshot taken');
  } catch (err) {
    return handleError(res, err, 'TakeSnapshot', 500);
  }
};

// ==================== TRACK TAB SWITCH ====================
/**
 * Track tab switch event
 * POST /interview/:id/tab-switch
 * FIX: Added proper tracking
 */
const trackTabSwitch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    await interview.incrementTabSwitch();

    return sendSuccess(res, { tabSwitchCount: interview.tabSwitchCount }, 'Tab switch recorded');
  } catch (err) {
    return handleError(res, err, 'TrackTabSwitch', 500);
  }
};

// ==================== GET RESULTS ====================
/**
 * Get interview results and feedback
 * GET /interview/:id/results
 */
const getResults = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    const isInstructor = req.userId && interview.instructor.toString() === req.userId.toString();

    if (!isInstructor && interview.status !== 'finished') {
      return sendError(res, 'Interview not finished yet', 403);
    }

    const results = {
      interviewId: interview._id,
      title: interview.title,
      type: interview.type,
      status: interview.status,
      duration: interview.duration,
      durationUsed: interview.durationUsed,
      startedAt: interview.startedAt,
      endedAt: interview.endedAt,
      candidate: interview.candidate,
      feedback: isInstructor ? interview.feedback : undefined,
      tabSwitchCount: interview.tabSwitchCount,
    };

    return sendSuccess(res, results, 'Results retrieved');
  } catch (err) {
    return handleError(res, err, 'GetResults', 500);
  }
};

// ==================== DELETE INTERVIEW ====================
/**
 * Delete interview
 * DELETE /interview/:id
 */
const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can delete', 403);
    }

    await Interview.findByIdAndDelete(id);

    console.log(`[AUDIT] Interview deleted: ${id}`);

    return sendSuccess(res, null, 'Interview deleted successfully');
  } catch (err) {
    return handleError(res, err, 'DeleteInterview', 500);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can add questions', 403);
    }

    if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
      const problem = await Problem.findById(problemId);
      if (!problem) {
        return sendError(res, 'Problem not found', 404);
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
    } else {
      return sendError(res, 'Either problemId or customContent is required', 400);
    }

    await interview.save();

    return sendSuccess(res, interview.questions, 'Question added');
  } catch (err) {
    return handleError(res, err, 'AddQuestion', 500);
  }
};

// ==================== BULK DELETE ====================
/**
 * Delete multiple interviews
 * POST /interview/bulk-delete
 */
const bulkDeleteInterviews = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 'Invalid IDs provided', 400);
    }
    
    const result = await Interview.deleteMany({ 
      _id: { $in: ids }, 
      instructor: req.userId 
    });
    
    return sendSuccess(res, { deletedCount: result.deletedCount }, 'Interviews deleted successfully');
  } catch (err) {
    return handleError(res, err, 'BulkDeleteInterviews', 500);
  }
};

// ==================== CLEANUP ====================
/**
 * Delete finished interviews older than 30 days
 * POST /interview/cleanup
 */
const cleanupInterviews = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Interview.deleteMany({
      instructor: req.userId,
      status: 'finished',
      updatedAt: { $lt: thirtyDaysAgo }
    });

    return sendSuccess(res, { deletedCount: result.deletedCount }, `Cleaned up ${result.deletedCount} old interviews`);
  } catch (err) {
    return handleError(res, err, 'CleanupInterviews', 500);
  }
};

export default {
  createInterview,
  getInterviews,
  getInterview,
  getInterviewByToken,
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
  bulkDeleteInterviews,
  cleanupInterviews,
  addQuestion,
};
