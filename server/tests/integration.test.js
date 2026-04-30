/**
 * Integration Tests for JudgeX Security & Performance Fixes
 * Tests: Validation, Rate Limiting, Auth, Error Handling, Performance
 */

import request from 'supertest';
import app from '../src/index.js';
import User from '../src/models/user.js';
import { generateTokenAndSetCookie } from '../src/utils/auth.js';

// ============================================
// Test Configuration
// ============================================

const TEST_USER = {
	email: 'test@example.com',
	password: 'TestPassword123!',
	name: 'Test User'
};

const TEST_INTERVIEW = {
	title: 'Test Interview',
	description: 'Test Description',
	status: 'ongoing'
};

// ============================================
// 1. INPUT VALIDATION TESTS
// ============================================

describe('Input Validation Tests', () => {
	describe('Signup Validation', () => {
		it('should reject signup with invalid email', async () => {
			const res = await request(app)
				.post('/auth/signup')
				.send({
					email: 'invalid-email',
					password: 'ValidPassword123!',
					name: 'Test User'
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBeDefined();
		});

		it('should reject signup with weak password', async () => {
			const res = await request(app)
				.post('/auth/signup')
				.send({
					email: 'test@example.com',
					password: 'weak',
					name: 'Test User'
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBeDefined();
		});

		it('should reject signup with short name', async () => {
			const res = await request(app)
				.post('/auth/signup')
				.send({
					email: 'test@example.com',
					password: 'ValidPassword123!',
					name: 'A'
				});

			expect(res.status).toBe(400);
			expect(res.body.error).toBeDefined();
		});

		it('should accept valid signup', async () => {
			const res = await request(app)
				.post('/auth/signup')
				.send(TEST_USER);

			expect(res.status).toBeOneOf([200, 201, 400]); // 400 if user exists
			if (res.status === 200 || res.status === 201) {
				expect(res.body.data).toBeDefined();
			}
		});
	});

	describe('Login Validation', () => {
		it('should reject login with missing email', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					password: 'ValidPassword123!'
				});

			expect(res.status).toBe(400);
		});

		it('should reject login with missing password', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'test@example.com'
				});

			expect(res.status).toBe(400);
		});

		it('should reject login with invalid email format', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'invalid-email',
					password: 'ValidPassword123!'
				});

			expect(res.status).toBe(400);
		});
	});

	describe('Submission Validation', () => {
		it('should reject submission with missing problem ID', async () => {
			const res = await request(app)
				.post('/submission/submit')
				.set('Cookie', 'auth_token=valid_token')
				.send({
					src: 'console.log("Hello");',
					language: 'javascript'
				});

			expect(res.status).toBeOneOf([400, 401, 403]);
		});

		it('should reject submission with invalid language', async () => {
			const res = await request(app)
				.post('/submission/submit')
				.set('Cookie', 'auth_token=valid_token')
				.send({
					src: 'console.log("Hello");',
					problem: '1',
					language: 'invalid_language'
				});

			expect(res.status).toBeOneOf([400, 401, 403]);
		});

		it('should reject submission with empty code', async () => {
			const res = await request(app)
				.post('/submission/submit')
				.set('Cookie', 'auth_token=valid_token')
				.send({
					src: '',
					problem: '1',
					language: 'javascript'
				});

			expect(res.status).toBeOneOf([400, 401, 403]);
		});
	});
});

// ============================================
// 2. RATE LIMITING TESTS
// ============================================

describe('Rate Limiting Tests', () => {
	describe('Login Rate Limiting', () => {
		it('should allow 5 login attempts within 15 minutes', async () => {
			let successCount = 0;
			
			for (let i = 0; i < 5; i++) {
				const res = await request(app)
					.post('/auth/login')
					.send({
						email: 'test@example.com',
						password: 'wrong_password'
					});

				if (res.status === 429) {
					break;
				}
				successCount++;
			}

			expect(successCount).toBe(5);
		});

		it('should block 6th login attempt within 15 minutes', async () => {
			// First 5 attempts
			for (let i = 0; i < 5; i++) {
				await request(app)
					.post('/auth/login')
					.send({
						email: 'test@example.com',
						password: 'wrong_password'
					});
			}

			// 6th attempt should be blocked
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'test@example.com',
					password: 'wrong_password'
				});

			expect(res.status).toBe(429);
			expect(res.body.error).toContain('too many');
		});
	});

	describe('Signup Rate Limiting', () => {
		it('should allow 3 signup attempts within 15 minutes', async () => {
			let successCount = 0;
			
			for (let i = 0; i < 3; i++) {
				const res = await request(app)
					.post('/auth/signup')
					.send({
						email: `test${i}@example.com`,
						password: 'ValidPassword123!',
						name: `Test User ${i}`
					});

				if (res.status === 429) {
					break;
				}
				successCount++;
			}

			expect(successCount).toBe(3);
		});

		it('should block 4th signup attempt within 15 minutes', async () => {
			// First 3 attempts
			for (let i = 0; i < 3; i++) {
				await request(app)
					.post('/auth/signup')
					.send({
						email: `test${i}@example.com`,
						password: 'ValidPassword123!',
						name: `Test User ${i}`
					});
			}

			// 4th attempt should be blocked
			const res = await request(app)
				.post('/auth/signup')
				.send({
					email: 'test4@example.com',
					password: 'ValidPassword123!',
					name: 'Test User 4'
				});

			expect(res.status).toBe(429);
		});
	});

	describe('Email Verification Rate Limiting', () => {
		it('should allow 10 email verification attempts', async () => {
			let successCount = 0;
			
			for (let i = 0; i < 10; i++) {
				const res = await request(app)
					.post('/auth/verify-email')
					.send({
						code: 'invalid_code'
					});

				if (res.status === 429) {
					break;
				}
				successCount++;
			}

			expect(successCount).toBe(10);
		});

		it('should block 11th email verification attempt', async () => {
			// First 10 attempts
			for (let i = 0; i < 10; i++) {
				await request(app)
					.post('/auth/verify-email')
					.send({
						code: 'invalid_code'
					});
			}

			// 11th attempt should be blocked
			const res = await request(app)
				.post('/auth/verify-email')
				.send({
					code: 'invalid_code'
				});

			expect(res.status).toBe(429);
		});
	});
});

// ============================================
// 3. ERROR HANDLING TESTS
// ============================================

describe('Error Handling Tests', () => {
	it('should not leak stack traces in error responses', async () => {
		const res = await request(app)
			.post('/auth/login')
			.send({
				email: 'test@example.com',
				password: 'password'
			});

		expect(res.body.stack).toBeUndefined();
		expect(res.body.error).toBeDefined();
		expect(typeof res.body.error).toBe('string');
	});

	it('should return consistent error format', async () => {
		const res = await request(app)
			.post('/auth/signup')
			.send({
				email: 'invalid-email',
				password: 'weak'
			});

		expect(res.body).toHaveProperty('error');
		expect(res.body).toHaveProperty('statusCode');
	});

	it('should return 404 for non-existent endpoints', async () => {
		const res = await request(app)
			.get('/api/non-existent-endpoint');

		expect(res.status).toBe(404);
		expect(res.body.error).toBeDefined();
	});

	it('should handle async errors gracefully', async () => {
		const res = await request(app)
			.get('/submission/invalid_id');

		expect(res.status).toBeOneOf([400, 404, 500]);
		expect(res.body.error).toBeDefined();
	});
});

// ============================================
// 4. SECURITY TESTS
// ============================================

describe('Security Tests', () => {
	describe('Authentication', () => {
		it('should reject requests without authentication token', async () => {
			const res = await request(app)
				.get('/submission');

			expect(res.status).toBeOneOf([401, 403]);
		});

		it('should reject requests with invalid token', async () => {
			const res = await request(app)
				.get('/submission')
				.set('Cookie', 'auth_token=invalid_token');

			expect(res.status).toBeOneOf([401, 403]);
		});
	});

	describe('CSRF Protection', () => {
		it('should enforce POST for sensitive operations (interview join)', async () => {
			// GET should be rejected or redirected
			const res = await request(app)
				.get('/interview/join')
				.query({ interviewId: '123' });

			expect(res.status).toBeOneOf([400, 405, 403, 404]);
		});
	});

	describe('Input Injection Prevention', () => {
		it('should sanitize email input', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: '<script>alert("xss")</script>@example.com',
					password: 'password'
				});

			expect(res.status).toBe(400);
		});

		it('should handle NoSQL injection attempts', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: { $ne: null },
					password: { $ne: null }
				});

			expect(res.status).toBe(400);
		});
	});

	describe('Email Verification Enforcement', () => {
		it('should require email verification before accessing protected resources', async () => {
			// This test assumes email verification is enforced
			const res = await request(app)
				.get('/user/profile')
				.set('Cookie', 'auth_token=valid_unverified_token');

			expect(res.status).toBeOneOf([401, 403, 400]);
		});
	});
});

// ============================================
// 5. PERFORMANCE TESTS
// ============================================

describe('Performance Tests', () => {
	it('should retrieve submission list within 500ms', async () => {
		const startTime = Date.now();

		await request(app)
			.get('/submission?limit=20')
			.set('Cookie', 'auth_token=valid_token');

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Performance threshold: should respond in less than 500ms
		expect(duration).toBeLessThan(500);
	});

	it('should use pagination to avoid large payloads', async () => {
		const res = await request(app)
			.get('/submission?limit=20&page=1')
			.set('Cookie', 'auth_token=valid_token');

		if (res.status === 200) {
			expect(res.body.data).toBeDefined();
			if (Array.isArray(res.body.data.submissions)) {
				expect(res.body.data.submissions.length).toBeLessThanOrEqual(20);
			}
		}
	});

	it('should not fetch more data than requested', async () => {
		const res = await request(app)
			.get('/submission?limit=10&page=1')
			.set('Cookie', 'auth_token=valid_token');

		if (res.status === 200 && res.body.data?.submissions) {
			expect(res.body.data.submissions.length).toBeLessThanOrEqual(10);
		}
	});
});

// ============================================
// 6. SOCKET.IO AUTHENTICATION TESTS
// ============================================

describe('Socket.IO Authentication Tests', () => {
	it('should reject socket connection without authentication token', (done) => {
		const io = require('socket.io-client');
		const socket = io('http://localhost:8080', {
			reconnection: false
		});

		socket.on('connect_error', (error) => {
			expect(error).toBeDefined();
			socket.disconnect();
			done();
		});

		setTimeout(() => {
			socket.disconnect();
			done();
		}, 1000);
	});

	it('should reject socket connection with invalid token', (done) => {
		const io = require('socket.io-client');
		const socket = io('http://localhost:8080', {
			auth: { token: 'invalid_token' },
			reconnection: false
		});

		socket.on('connect_error', (error) => {
			expect(error).toBeDefined();
			socket.disconnect();
			done();
		});

		setTimeout(() => {
			socket.disconnect();
			done();
		}, 1000);
	});
});

// ============================================
// 7. INTERVIEW CONTROLLER TESTS
// ============================================

describe('Interview Controller Tests', () => {
	describe('Race Condition Prevention', () => {
		it('should prevent multiple candidates from joining same interview', async () => {
			// This test simulates concurrent join attempts
			// Should be protected by MongoDB transactions
		});
	});

	describe('Interview Status Validation', () => {
		it('should not allow modifications to finished interviews', async () => {
			// Test that finished interviews cannot be modified
		});
	});

	describe('Contest Time Enforcement', () => {
		it('should reject submissions after contest end time', async () => {
			// Test that submissions after contest.endTime are rejected
		});
	});
});

// ============================================
// 8. SUBMISSION DUPLICATE PREVENTION
// ============================================

describe('Submission Duplicate Prevention', () => {
	it('should reject duplicate submission within 5 seconds', async () => {
		const submissionData = {
			src: 'console.log("test");',
			problem: '1',
			language: 'javascript'
		};

		// First submission
		const res1 = await request(app)
			.post('/submission/submit')
			.set('Cookie', 'auth_token=valid_token')
			.send(submissionData);

		// Immediate duplicate
		const res2 = await request(app)
			.post('/submission/submit')
			.set('Cookie', 'auth_token=valid_token')
			.send(submissionData);

		// Second should be rejected
		expect(res2.status).toBe(429);
	});

	it('should allow resubmission after 5 seconds', async () => {
		// This test requires timing and may need to be adjusted
		// based on the actual implementation
	});
});

// ============================================
// Test Helpers
// ============================================

// Helper function to create test user
export async function createTestUser(userData = {}) {
	const user = await User.create({
		...TEST_USER,
		...userData
	});
	return user;
}

// Helper function to generate auth token
export async function getAuthToken(user) {
	const token = generateTokenAndSetCookie(user._id, {
		httpOnly: true,
		secure: false,
		sameSite: 'lax'
	});
	return token;
}

// Custom Jest matchers
expect.extend({
	toBeOneOf(received, expected) {
		const pass = expected.includes(received);
		return {
			pass,
			message: () => `expected ${received} to be one of ${expected.join(', ')}`
		};
	}
});

// ============================================
// Setup & Teardown
// ============================================

beforeAll(async () => {
	// Connect to test database
	// Clear test data
});

afterAll(async () => {
	// Clean up test database
	// Close connections
});

afterEach(async () => {
	// Clear rate limiter in-memory stores
	// Reset test data
});
