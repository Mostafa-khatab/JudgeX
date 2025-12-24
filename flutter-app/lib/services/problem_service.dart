import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../models/problem.dart';

class ProblemService {
  final _apiClient = ApiClient();

  Future<List<Problem>> getProblems({String? difficulty,String? search,List<String>? tags}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (difficulty != null) queryParams['difficulty'] = difficulty;
      if (search != null) queryParams['search'] = search;
      if (tags != null && tags.isNotEmpty) queryParams['tags'] = tags.join(',');
      final response = await _apiClient.dio.get(ApiConstants.problems,queryParameters: queryParams);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List ? response.data : response.data['problems'] ?? [];
        return data.map((json) => Problem.fromJson(json)).toList();
      }
    } catch (e) {return [];}
    return [];
  }

  Future<Problem?> getProblemById(String id) async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.problems}/$id');
      if (response.statusCode == 200) return Problem.fromJson(response.data);
    } catch (e) {return null;}
    return null;
  }

  Future<Map<String, dynamic>> submitSolution({required String problemId,required String code,required String language}) async {
    try {
      final response = await _apiClient.dio.post(ApiConstants.submissions,data: {'problemId': problemId,'code': code,'language': language});
      if (response.statusCode == 200 || response.statusCode == 201) return {'success': true,'submission': response.data};
    } catch (e) {return {'success': false,'error': e.toString()};}
    return {'success': false,'error': 'Submission failed'};
  }
}
