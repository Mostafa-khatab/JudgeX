import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/problems_provider.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../core/widgets/gradient_button.dart';

class InterviewScreen extends StatefulWidget {
  final String problemId;
  const InterviewScreen({super.key, required this.problemId});
  @override
  State<InterviewScreen> createState() => _InterviewScreenState();
}

class _InterviewScreenState extends State<InterviewScreen> {
  final TextEditingController _codeController = TextEditingController(text: '// Write your code here\n');
  String _selectedLanguage = 'cpp';
  bool _isSubmitting = false;

  @override
  void initState() {super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<ProblemsProvider>().fetchProblemById(widget.problemId));}

  @override
  void dispose() {_codeController.dispose();super.dispose();}

  Future<void> _submitSolution() async {
    setState(() => _isSubmitting = true);
    final result = await context.read<ProblemsProvider>().submitSolution(problemId: widget.problemId,
        code: _codeController.text,language: _selectedLanguage);
    setState(() => _isSubmitting = false);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result['success'] ? 'Solution submitted successfully!' : result['error'] ?? 'Submission failed'),
        backgroundColor: result['success'] ? Colors.green : Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    final problemsProvider = context.watch<ProblemsProvider>();
    final problem = problemsProvider.selectedProblem;
    return Scaffold(appBar: AppBar(title: Text(problem?.title ?? 'Interview'),actions: [
        DropdownButton<String>(value: _selectedLanguage,underline: const SizedBox(),dropdownColor: Theme.of(context).cardColor,
          items: const [DropdownMenuItem(value: 'cpp', child: Text('C++')),DropdownMenuItem(value: 'python', child: Text('Python')),
            DropdownMenuItem(value: 'java', child: Text('Java')),DropdownMenuItem(value: 'javascript', child: Text('JavaScript'))],
          onChanged: (value) {if (value != null) setState(() => _selectedLanguage = value);}),
        const SizedBox(width: 16)]),
      body: problemsProvider.isLoading || problem == null ? const LoadingIndicator(message: 'Loading problem...') :
        Row(children: [
          Expanded(flex: 1,child: Container(color: Theme.of(context).cardColor,
              child: SingleChildScrollView(padding: const EdgeInsets.all(16),child: Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
                  Text(problem.title,style: Theme.of(context).textTheme.displayMedium),const SizedBox(height: 16),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 8,vertical: 4),
                    decoration: BoxDecoration(color: _getDifficultyColor(problem.difficulty).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4)),
                    child: Text(problem.difficulty.toUpperCase(),style: TextStyle(fontSize: 12,fontWeight: FontWeight.bold,
                        color: _getDifficultyColor(problem.difficulty)))),
                  const SizedBox(height: 24),
                  Text('Description',style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(problem.description,style: Theme.of(context).textTheme.bodyMedium)])))),
          Expanded(flex: 1,child: Column(children: [
              Expanded(child: Container(color: const Color(0xFF1E1E1E),padding: const EdgeInsets.all(16),
                  child: TextField(controller: _codeController,maxLines: null,expands: true,
                    style: const TextStyle(fontFamily: 'monospace',fontSize: 14,color: Colors.white),
                    decoration: const InputDecoration(border: InputBorder.none,hintText: '// Write your code here',
                      hintStyle: TextStyle(color: Colors.grey))))),
              Container(padding: const EdgeInsets.all(16),color: Theme.of(context).cardColor,
                child: Row(mainAxisAlignment: MainAxisAlignment.end,children: [
                  GradientButton(text: 'Submit Solution',onPressed: _submitSolution,isLoading: _isSubmitting)]))]))]));
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
