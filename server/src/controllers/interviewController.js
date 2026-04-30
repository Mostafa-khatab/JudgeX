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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token } = req.params;
    // FIX: Use POST body instead of query parameters
    const validatedData = await validateSchema(JoinInterviewSchema, req.body);
    const { name, email } = validatedData;

    // FIX: Validate token format
    if (!token || !/^[a-f0-9]{32}$/.test(token)) {
      await session.abortTransaction();
      return sendError(res, 'Invalid interview token', 400);
    }

    const interview = await Interview.findOne({ inviteToken: token }).session(session);

    if (!interview) {
      await session.abortTransaction();
      return sendError(res, 'Interview not found or invalid token', 404);
    }

    if (interview.status === 'finished' || interview.status === 'cancelled') {
      await session.abortTransaction();
      return sendError(res, 'This interview has already ended', 400);
    }

    // FIX: Prevent multiple candidates from joining
    if (interview.candidate.isConnected && interview.candidate.email && interview.candidate.email !== email) {
      await session.abortTransaction();
      return sendError(res, 'Another candidate is already joined to this interview', 400);
    }

    // Update candidate info
    interview.candidate.name = name;
    interview.candidate.email = email;
    interview.candidate.joinedAt = new Date();
    interview.candidate.isConnected = true;

    await interview.save({ session });
    await session.commitTransaction();

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

    console.log(`[AUDIT] Candidate joined interview: ${interview._id}, email: ${email}`);

    return sendSuccess(res, {
      ...responseData,
      candidateToken: token,
      role: 'candidate'
    }, 'Joined interview successfully');
  } catch (err) {
    await session.abortTransaction();
    return handleError(res, err, 'JoinInterview', 500);
  } finally {
    session.endSession();
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
    const { io } = req.app.locals; // Socket.IO instance

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid interview ID', 400);
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return sendError(res, 'Interview not found', 404);
    }

    if (interview.instructor.toString() !== req.userId.toString()) {
      return sendError(res, 'Only interviewer can end', 403);
    }

    // 1. Take final snapshot before closing
    await interview.addSnapshot(
      interview.state.code,
      interview.state.language,
      interview.state.activeProblemId,
      'Final snapshot at interview end',
      true
    );

    // 2. Update status and timestamps
    interview.status = 'finished';
    interview.endedAt = new Date();
    interview.candidate.isConnected = false;

    await interview.save();

    // 3. CLEANUP: Emit finished event to all participants
    if (io) {
      io.to(`interview:${id}`).emit('interview-finished', {
        status: 'finished',
        endedAt: interview.endedAt,
        message: 'Interview session has ended'
      });

      // 4. Disconnect all sockets in this room
      io.to(`interview:${id}`).disconnectSockets();
    }

    // 5. Log audit
    console.log(`[AUDIT] Interview ended: ${interview._id}, instructor: ${interview.instructor}`);

    return sendSuccess(res, interview.toObject(), 'Interview ended successfully');
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

    return sendSuccess(res, { message: content, role: isInstructor ? 'interviewer' : 'candidate' }, 'Message added');
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

export default {
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
  addQuestion,
};
