class Problem {
  final String id;final String title;final String description;final String difficulty;final List<String> tags;
  final int acceptanceRate;final int totalSubmissions;final int acceptedSubmissions;

  Problem({required this.id,required this.title,required this.description,required this.difficulty,this.tags = const [],
    this.acceptanceRate = 0,this.totalSubmissions = 0,this.acceptedSubmissions = 0});

  factory Problem.fromJson(Map<String, dynamic> json) {
    return Problem(id: json['_id'] ?? json['id'] ?? '',title: json['title'] ?? '',description: json['description'] ?? '',
      difficulty: json['difficulty'] ?? 'easy',tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      acceptanceRate: json['acceptanceRate'] ?? 0,totalSubmissions: json['totalSubmissions'] ?? 0,
      acceptedSubmissions: json['acceptedSubmissions'] ?? 0);
  }

  Map<String, dynamic> toJson() => {'_id': id,'title': title,'description': description,'difficulty': difficulty,
    'tags': tags,'acceptanceRate': acceptanceRate,'totalSubmissions': totalSubmissions,'acceptedSubmissions': acceptedSubmissions};
}
