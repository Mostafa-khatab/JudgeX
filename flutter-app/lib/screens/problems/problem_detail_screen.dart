import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/problems_provider.dart';
import '../../core/widgets/loading_indicator.dart';

class ProblemDetailScreen extends StatefulWidget {
  final String problemId;
  const ProblemDetailScreen({super.key, required this.problemId});
  @override
  State<ProblemDetailScreen> createState() => _ProblemDetailScreenState();
}

class _ProblemDetailScreenState extends State<ProblemDetailScreen> {
  @override
  void initState() {super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<ProblemsProvider>().fetchProblemById(widget.problemId));}

  @override
  Widget build(BuildContext context) {
    final problemsProvider = context.watch<ProblemsProvider>();
    final problem = problemsProvider.selectedProblem;
    return Scaffold(appBar: AppBar(title: const Text('Problem Details')),
      body: problemsProvider.isLoading || problem == null ? const LoadingIndicator(message: 'Loading problem...') :
        SingleChildScrollView(padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,children: [
            Text(problem.title,style: Theme.of(context).textTheme.displayMedium),
            const SizedBox(height: 16),
            Text(problem.description,style: Theme.of(context).textTheme.bodyLarge)])));
  }
}
