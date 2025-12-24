class ApiConstants {
  static const String baseUrl = 'http://localhost:5000';
  
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String refreshToken = '/api/auth/refresh';
  static const String userInfo = '/api/user/info';
  static const String problems = '/api/problems';
  static const String submissions = '/api/submissions';
  static const String contests = '/api/contests';
  
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
}
