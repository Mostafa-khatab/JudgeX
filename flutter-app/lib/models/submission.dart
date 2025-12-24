class Submission {
  final String id;final String problemId;final String userId;final String code;final String language;final String status;
  final int? runtime;final int? memory;final DateTime submittedAt;

  Submission({required this.id,required this.problemId,required this.userId,required this.code,required this.language,
    required this.status,this.runtime,this.memory,required this.submittedAt});

  factory Submission.fromJson(Map<String, dynamic> json) {
    return Submission(id: json['_id'] ?? json['id'] ?? '',problemId: json['problemId'] ?? '',userId: json['userId'] ?? '',
      code: json['code'] ?? '',language: json['language'] ?? '',status: json['status'] ?? 'pending',
      runtime: json['runtime'],memory: json['memory'],
      submittedAt: json['submittedAt'] != null ? DateTime.parse(json['submittedAt']) : DateTime.now());
  }

  Map<String, dynamic> toJson() => {'_id': id,'problemId': problemId,'userId': userId,'code': code,'language': language,
    'status': status,'runtime': runtime,'memory': memory,'submittedAt': submittedAt.toIso8601String()};

  bool get isAccepted => status.toLowerCase() == 'accepted';
  bool get isPending => status.toLowerCase() == 'pending';
}
