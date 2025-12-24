import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/user_service.dart';

class UserProvider with ChangeNotifier {
  final UserService _userService = UserService();
  User? _profile;bool _isLoading = false;String? _errorMessage;

  User? get profile => _profile;bool get isLoading => _isLoading;String? get errorMessage => _errorMessage;

  Future<void> fetchProfile() async {
    _isLoading = true;_errorMessage = null;notifyListeners();
    _profile = await _userService.getProfile();
    _isLoading = false;notifyListeners();
  }

  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    _isLoading = true;_errorMessage = null;notifyListeners();
    final success = await _userService.updateProfile(updates);
    if (success) await fetchProfile(); else _errorMessage = 'Failed to update profile';
    _isLoading = false;notifyListeners();return success;
  }
}
