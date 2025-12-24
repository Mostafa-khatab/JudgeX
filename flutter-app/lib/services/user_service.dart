import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/user.dart';

class UserService {
  final _apiClient = ApiClient();

  Future<User?> getProfile() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.userInfo);
      if (response.statusCode == 200) return User.fromJson(response.data);
    } catch (e) {return null;}
    return null;
  }

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _apiClient.dio.put(ApiConstants.userInfo,data: updates);
      return response.statusCode == 200;
    } catch (e) {return false;}
  }
}
