import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_provider.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<UserProvider>().fetchProfile());}

  Future<void> _handleLogout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final userProvider = context.watch<UserProvider>();
    final user = authProvider.user ?? userProvider.profile;

    return Scaffold(appBar: AppBar(title: const Text('Profile'),
        leading: IconButton(icon: const Icon(Icons.arrow_back),onPressed: () => context.go('/'))),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16),child: Column(children: [
          GlassCard(padding: const EdgeInsets.all(24),child: Column(children: [
              CircleAvatar(radius: 50,backgroundColor: const Color(0xFF6366F1),
                child: Text(user?.username.substring(0, 1).toUpperCase() ?? 'U',
                  style: const TextStyle(fontSize: 40,fontWeight: FontWeight.bold,color: Colors.white))),
              const SizedBox(height: 16),
              Text(user?.username ?? 'User',style: Theme.of(context).textTheme.displayMedium),
              const SizedBox(height: 4),
              Text(user?.email ?? '',style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 24),
              Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly,children: [
                _buildStatCard(context,'Solved','${user?.solvedProblems ?? 0}',Icons.check_circle,const Color(0xFF10B981)),
                _buildStatCard(context,'Submissions','${user?.totalSubmissions ?? 0}',Icons.code,const Color(0xFF6366F1))])])),
          const SizedBox(height: 24),
          GlassCard(padding: const EdgeInsets.all(16),child: Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
              Text('Account Information',style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              _buildInfoRow(context, 'Role', user?.role ?? 'user'),
              const Divider(height: 24),
              _buildInfoRow(context, 'Account Status', 'Active')])),
          const SizedBox(height: 24),
          GradientButton(text: 'Logout',onPressed: _handleLogout,
            gradientColors: const [Color(0xFFEF4444),Color(0xFFDC2626)])])));
  }

  Widget _buildStatCard(BuildContext context,String label,String value,IconData icon,Color color) {
    return Container(padding: const EdgeInsets.all(16),decoration: BoxDecoration(color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12)),
      child: Column(children: [Icon(icon,color: color,size: 32),const SizedBox(height: 8),
        Text(value,style: Theme.of(context).textTheme.displayMedium?.copyWith(color: color)),
        Text(label,style: Theme.of(context).textTheme.bodyMedium)]));
  }

  Widget _buildInfoRow(BuildContext context, String label, String value) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,children: [
      Text(label,style: Theme.of(context).textTheme.bodyMedium),
      Text(value,style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600))]);
  }
}
