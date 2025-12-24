class User {
  final String id;final String username;final String email;final String? avatarUrl;
  final int solvedProblems;final int totalSubmissions;final String role;

  User({required this.id,required this.username,required this.email,this.avatarUrl,this.solvedProblems = 0,this.totalSubmissions = 0,this.role = 'user'});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(id: json['_id'] ?? json['id'] ?? '',username: json['username'] ?? '',email: json['email'] ?? '',
      avatarUrl: json['avatarUrl'] ?? json['avatar'],solvedProblems: json['solvedProblems'] ?? 0,
      totalSubmissions: json['totalSubmissions'] ?? 0,role: json['role'] ?? 'user');
  }

  Map<String, dynamic> toJson() {
    return {'_id': id,'username': username,'email': email,'avatarUrl': avatarUrl,'solvedProblems': solvedProblems,
      'totalSubmissions': totalSubmissions,'role': role};
  }
}
