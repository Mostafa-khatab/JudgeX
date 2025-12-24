import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/problems_provider.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/loading_indicator.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {super.initState();WidgetsBinding.instance.addPostFrameCallback((_) => context.read<ProblemsProvider>().fetchProblems());}

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final problemsProvider = context.watch<ProblemsProvider>();
    final user = authProvider.user;

    return Scaffold(appBar: AppBar(title: const Text('JudgeX'),actions: [
        IconButton(icon: const Icon(Icons.person),onPressed: () => context.go('/profile'))]),
      body: problemsProvider.isLoading ? const LoadingIndicator(message: 'Loading problems...') :
        SingleChildScrollView(child: Padding(padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
              GlassCard(padding: const EdgeInsets.all(24),child: Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
                  Text('Welcome, ${user?.username ?? 'User'}!',style: Theme.of(context).textTheme.displayMedium),
                  const SizedBox(height: 8),
                  Row(children: [
                    _buildStat(context,'Solved','${user?.solvedProblems ?? 0}',Icons.check_circle,const Color(0xFF10B981)),
                    const SizedBox(width: 24),
                    _buildStat(context,'Submissions','${user?.totalSubmissions ?? 0}',Icons.code,const Color(0xFF6366F1))])])),
              const SizedBox(height: 24),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,children: [
                Text('Problems',style: Theme.of(context).textTheme.displayMedium),
                TextButton(onPressed: () => context.go('/problems'),child: const Text('View All'))]),
              const SizedBox(height: 16),
              ...problemsProvider.problems.take(5).map((problem) => GestureDetector(onTap: () => context.go('/interview/${problem.id}'),
                  child: GlassCard(margin: const EdgeInsets.only(bottom: 12),padding: const EdgeInsets.all(16),
                    child: Row(children: [
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
                          Text(problem.title,style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Row(children: [
                            Container(padding: const EdgeInsets.symmetric(horizontal: 8,vertical: 2),
                              decoration: BoxDecoration(color: _getDifficultyColor(problem.difficulty).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4)),
                              child: Text(problem.difficulty.toUpperCase(),style: TextStyle(fontSize: 10,fontWeight: FontWeight.bold,
                                  color: _getDifficultyColor(problem.difficulty)))),
                            const SizedBox(width: 8),
                            Text('${problem.acceptanceRate}% accepted',style: Theme.of(context).textTheme.bodyMedium)])])),
                      const Icon(Icons.chevron_right)]))))])));
  }

  Widget _buildStat(BuildContext context,String label,String value,IconData icon,Color color) {
    return Row(children: [Icon(icon,color: color,size: 20),const SizedBox(width: 8),
      Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
        Text(value,style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 20)),
        Text(label,style: Theme.of(context).textTheme.bodyMedium)])]);
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy': return const Color(0xFF10B981);
      case 'medium': return const Color(0xFFF59E0B);
      case 'hard': return const Color(0xFFEF4444);
      default: return const Color(0xFF6366F1);
    }
  }
}
