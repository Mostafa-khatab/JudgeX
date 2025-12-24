import 'package:go_router/go_router.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/problems/problems_list_screen.dart';
import '../screens/problems/problem_detail_screen.dart';
import '../screens/interview/interview_screen.dart';
import '../screens/profile/profile_screen.dart';

class AppRouter {
  static final router = GoRouter(initialLocation: '/login',routes: [
    GoRoute(path: '/login',name: 'login',builder: (context, state) => const LoginScreen()),
    GoRoute(path: '/register',name: 'register',builder: (context, state) => const RegisterScreen()),
    GoRoute(path: '/',name: 'home',builder: (context, state) => const HomeScreen()),
    GoRoute(path: '/problems',name: 'problems',builder: (context, state) => const ProblemsListScreen()),
    GoRoute(path: '/problems/:id',name: 'problem-detail',builder: (context, state) => ProblemDetailScreen(problemId: state.pathParameters['id']!)),
    GoRoute(path: '/interview/:id',name: 'interview',builder: (context, state) => InterviewScreen(problemId: state.pathParameters['id']!)),
    GoRoute(path: '/profile',name: 'profile',builder: (context, state) => const ProfileScreen())]);
}
