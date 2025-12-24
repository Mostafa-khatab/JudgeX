import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/user.dart';

class AuthService {
  final _apiClient = ApiClient();

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.login,data: {'email': email,'password': password});
      if (response.statusCode == 200) {
        final data = response.data;
        await _apiClient.saveToken(data['accessToken'] ?? data['token'],data['refreshToken'] ?? '');
        return {'success': true,'user': User.fromJson(data['user']),'token': data['accessToken'] ?? data['token']};
      }
    } catch (e) {return {'success': false,'error': e.toString()};}
    return {'success': false,'error': 'Login failed'};
  }

  Future<Map<String, dynamic>> register(String username, String email, String password) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.register,data: {'username': username,'email': email,'password': password});
      if (response.statusCode == 200 || response.statusCode == 201) return {'success': true,'message': 'Registration successful'};
    } catch (e) {return {'success': false,'error': e.toString()};}
    return {'success': false,'error': 'Registration failed'};
  }

  Future<void> logout() async => await _apiClient.clearTokens();

  Future<User?> getUserInfo() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.userInfo);
      if (response.statusCode == 200) return User.fromJson(response.data);
    } catch (e) {return null;}
    return null;
  }
}
