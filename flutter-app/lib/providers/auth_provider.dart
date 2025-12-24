import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;bool _isAuthenticated = false;bool _isLoading = false;String? _errorMessage;

  User? get user => _user;bool get isAuthenticated => _isAuthenticated;bool get isLoading => _isLoading;String? get errorMessage => _errorMessage;

  Future<bool> login(String email, String password) async {
    _isLoading = true;_errorMessage = null;notifyListeners();
    final result = await _authService.login(email, password);
    if (result['success']) {_user = result['user'];_isAuthenticated = true;_isLoading = false;notifyListeners();return true;}
    else {_errorMessage = result['error'];_isLoading = false;notifyListeners();return false;}
  }

  Future<bool> register(String username, String email, String password) async {
    _isLoading = true;_errorMessage = null;notifyListeners();
    final result = await _authService.register(username, email, password);
    _isLoading = false;
    if (result['success']) {notifyListeners();return true;}
    else {_errorMessage = result['error'];notifyListeners();return false;}
  }

  Future<void> logout() async {await _authService.logout();_user = null;_isAuthenticated = false;notifyListeners();}

  Future<void> checkAuth() async {
    final user = await _authService.getUserInfo();
    if (user != null) {_user = user;_isAuthenticated = true;notifyListeners();}
  }
}
