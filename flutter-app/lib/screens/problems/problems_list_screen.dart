import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/problems_provider.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/loading_indicator.dart';

class ProblemsListScreen extends StatefulWidget {
  const ProblemsListScreen({super.key});
  @override
  State<ProblemsListScreen> createState() => _ProblemsListScreenState();
}

class _ProblemsListScreenState extends State<ProblemsListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String? _selectedDifficulty;

  @override
  void initState() {super.initState();WidgetsBinding.instance.addPostFrameCallback((_) => context.read<ProblemsProvider>().fetchProblems());}

  @override
  void dispose() {_searchController.dispose();super.dispose();}

  @override
  Widget build(BuildContext context) {
    final problemsProvider = context.watch<ProblemsProvider>();
    return Scaffold(appBar: AppBar(title: const Text('Problems'),
        leading: IconButton(icon: const Icon(Icons.arrow_back),onPressed: () => context.go('/'))),
      body: Column(children: [
        Padding(padding: const EdgeInsets.all(16),child: Column(children: [
            TextField(controller: _searchController,decoration: InputDecoration(hintText: 'Search problems...',prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                suffixIcon: _searchController.text.isNotEmpty ? IconButton(icon: const Icon(Icons.clear),
                    onPressed: () {_searchController.clear();problemsProvider.setSearchQuery(null);}) : null),
              onChanged: (value) => problemsProvider.setSearchQuery(value.isEmpty ? null : value)),
            const SizedBox(height: 12),
            SingleChildScrollView(scrollDirection: Axis.horizontal,child: Row(children: [
                _buildFilterChip('All',_selectedDifficulty == null,() {setState(() => _selectedDifficulty = null);
                  problemsProvider.setDifficultyFilter(null);}),
                const SizedBox(width: 8),
                _buildFilterChip('Easy',_selectedDifficulty == 'easy',() {setState(() => _selectedDifficulty = 'easy');
                  problemsProvider.setDifficultyFilter('easy');},const Color(0xFF10B981)),
                const SizedBox(width: 8),
                _buildFilterChip('Medium',_selectedDifficulty == 'medium',() {setState(() => _selectedDifficulty = 'medium');
                  problemsProvider.setDifficultyFilter('medium');},const Color(0xFFF59E0B)),
                const SizedBox(width: 8),
                _buildFilterChip('Hard',_selectedDifficulty == 'hard',() {setState(() => _selectedDifficulty = 'hard');
                  problemsProvider.setDifficultyFilter('hard');},const Color(0xFFEF4444))]))]),)
        ,Expanded(child: problemsProvider.isLoading ? const LoadingIndicator(message: 'Loading problems...') :
            ListView.builder(padding: const EdgeInsets.symmetric(horizontal: 16),itemCount: problemsProvider.problems.length,
              itemBuilder: (context, index) {
                final problem = problemsProvider.problems[index];
                return GestureDetector(onTap: () => context.go('/interview/${problem.id}'),
                  child: GlassCard(margin: const EdgeInsets.only(bottom: 12),padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
                      Row(children: [
                        Expanded(child: Text(problem.title,style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600))),
                        Container(padding: const EdgeInsets.symmetric(horizontal: 8,vertical: 4),
                          decoration: BoxDecoration(color: _getDifficultyColor(problem.difficulty).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4)),
                          child: Text(problem.difficulty.toUpperCase(),style: TextStyle(fontSize: 10,fontWeight: FontWeight.bold,
                              color: _getDifficultyColor(problem.difficulty))))]),
                      const SizedBox(height: 8),
                      Wrap(spacing: 4,runSpacing: 4,children: problem.tags.take(3).map((tag) =>
                        Container(padding: const EdgeInsets.symmetric(horizontal: 6,vertical: 2),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.1),borderRadius: BorderRadius.circular(4)),
                          child: Text(tag,style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10)))).toList()),
                      const SizedBox(height: 8),
                      Text('Acceptance: ${problem.acceptanceRate}% | Submissions: ${problem.totalSubmissions}',
                        style: Theme.of(context).textTheme.bodyMedium)])));}))]));}

  Widget _buildFilterChip(String label,bool isSelected,VoidCallback onTap,[Color? color]) {
    return GestureDetector(onTap: onTap,child: Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(color: isSelected ? (color ?? const Color(0xFF6366F1)) : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20)),
        child: Text(label,style: TextStyle(color: isSelected ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal))));
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
