/**
 * Validation Schemas using Zod
 * Centralized input validation for all endpoints
 */

import { z } from 'zod';
import {
  EMAIL_REGEX,
  PASSWORD_MIN_LENGTH,
  MAX_USER_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_INTERVIEW_TITLE_LENGTH,
  INTERVIEW_DURATION_MIN,
  INTERVIEW_DURATION_MAX,
} from '../constants/config.js';

// ==================== AUTH SCHEMAS ====================

export const SignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  name: z.string().min(3, 'Name must be at least 3 characters').max(MAX_USER_NAME_LENGTH, `Name must not exceed ${MAX_USER_NAME_LENGTH} characters`),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  admin: z.boolean().optional().default(false),
  remember: z.boolean().optional().default(true),
});

export const VerifyEmailSchema = z.object({
  code: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid verification code format'),
});

export const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{40}$/, 'Invalid reset token format'),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

// ==================== USER SCHEMAS ====================

export const UpdateProfileSchema = z.object({
  fullname: z.string().max(MAX_USER_NAME_LENGTH, `Name must not exceed ${MAX_USER_NAME_LENGTH} characters`).optional(),
  bio: z.string().max(MAX_BIO_LENGTH, `Bio must not exceed ${MAX_BIO_LENGTH} characters`).optional(),
});

// ==================== SUBMISSION SCHEMAS ====================

export const SubmitCodeSchema = z.object({
  src: z.string().min(1, 'Code cannot be empty').max(50000, 'Code too large'),
  problem: z.string().min(1, 'Problem ID is required'),
  language: z.enum(['c', 'c11', 'c++11', 'c++14', 'c++17', 'c++20', 'python2', 'python3', 'java', 'javascript', 'node']),
  contest: z.string().optional(),
});

// ==================== INTERVIEW SCHEMAS ====================

export const CreateInterviewSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(MAX_INTERVIEW_TITLE_LENGTH, `Title must not exceed ${MAX_INTERVIEW_TITLE_LENGTH} characters`),
  type: z.enum(['assessment', 'mock', 'screening', 'technical']).optional().default('technical'),
  duration: z.number().min(INTERVIEW_DURATION_MIN, `Duration must be at least ${INTERVIEW_DURATION_MIN} minutes`).max(INTERVIEW_DURATION_MAX, `Duration must not exceed ${INTERVIEW_DURATION_MAX} minutes`),
  description: z.string().max(2000, 'Description too long').optional(),
  allowedLanguages: z.array(z.enum(['cpp', 'c', 'python', 'javascript', 'java', 'go', 'rust', 'typescript'])).optional(),
  scheduledAt: z.string().datetime().optional(),
  questions: z.array(z.object({
    problemId: z.string().optional(),
    customContent: z.object({
      title: z.string(),
      description: z.string(),
      examples: z.string().optional(),
      constraints: z.string().optional(),
    }).optional(),
  })).optional(),
});

export const JoinInterviewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(MAX_USER_NAME_LENGTH, `Name must not exceed ${MAX_USER_NAME_LENGTH} characters`),
  email: z.string().email('Invalid email format'),
});

export const AddInterviewMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
});

export const SaveFeedbackSchema = z.object({
  problemSolving: z.object({
    score: z.number().min(1).max(5),
    notes: z.string().max(1000).optional(),
  }).optional(),
  communication: z.object({
    score: z.number().min(1).max(5),
    notes: z.string().max(1000).optional(),
  }).optional(),
  codingStyle: z.object({
    score: z.number().min(1).max(5),
    notes: z.string().max(1000).optional(),
  }).optional(),
  technicalKnowledge: z.object({
    score: z.number().min(1).max(5),
    notes: z.string().max(1000).optional(),
  }).optional(),
  overallNotes: z.string().max(2000).optional(),
  recommendation: z.enum(['strong_hire', 'hire', 'lean_hire', 'lean_no_hire', 'no_hire']).optional(),
});

// ==================== CONTEST SCHEMAS ====================

export const CreateContestSchema = z.object({
  id: z.string().min(1, 'Contest ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  problems: z.array(z.string()),
});

// ==================== VALIDATION HELPER ====================

export const validateSchema = async (schema, data) => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(messages.join(', '));
    }
    throw error;
  }
};
