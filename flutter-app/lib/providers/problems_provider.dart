import 'package:flutter/foundation.dart';
import '../models/problem.dart';
import '../services/problem_service.dart';

class ProblemsProvider with ChangeNotifier {
  final ProblemService _problemService = ProblemService();
  List<Problem> _problems = [];Problem? _selectedProblem;bool _isLoading = false;String? _errorMessage;
  String? _difficultyFilter;String? _searchQuery;List<String> _tagFilters = [];

  List<Problem> get problems => _problems;Problem? get selectedProblem => _selectedProblem;bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;String? get difficultyFilter => _difficultyFilter;String? get searchQuery => _searchQuery;
  List<String> get tagFilters => _tagFilters;

  Future<void> fetchProblems() async {
    _isLoading = true;_errorMessage = null;notifyListeners();
    _problems = await _problemService.getProblems(difficulty: _difficultyFilter,search: _searchQuery,tags: _tagFilters.isEmpty ? null : _tagFilters);
    _isLoading = false;notifyListeners();
  }

  Future<void> fetchProblemById(String id) async {
    _isLoading = true;_errorMessage = null;notifyListeners();
    _selectedProblem = await _problemService.getProblemById(id);
    _isLoading = false;notifyListeners();
  }

  void setDifficultyFilter(String? difficulty) {_difficultyFilter = difficulty;fetchProblems();}
  void setSearchQuery(String? query) {_searchQuery = query;fetchProblems();}
  void addTagFilter(String tag) {if (!_tagFilters.contains(tag)) {_tagFilters.add(tag);fetchProblems();}}
  void removeTagFilter(String tag) {_tagFilters.remove(tag);fetchProblems();}
  void clearFilters() {_difficultyFilter = null;_searchQuery = null;_tagFilters = [];fetchProblems();}

  Future<Map<String, dynamic>> submitSolution({required String problemId,required String code,required String language}) async =>
    await _problemService.submitSolution(problemId: problemId,code: code,language: language);
}
