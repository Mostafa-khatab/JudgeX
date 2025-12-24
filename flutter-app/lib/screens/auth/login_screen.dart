import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/widgets/gradient_button.dart';
import '../../core/widgets/glass_card.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {_emailController.dispose();_passwordController.dispose();super.dispose();}

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.login(_emailController.text.trim(),_passwordController.text);
      if (success && mounted) context.go('/');
      else if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(authProvider.errorMessage ?? 'Login failed'),backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft,end: Alignment.bottomRight,
            colors: [Theme.of(context).scaffoldBackgroundColor,const Color(0xFF1E293B)])),
        child: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(24),
              child: GlassCard(padding: const EdgeInsets.all(32),child: Form(key: _formKey,
                  child: Column(mainAxisSize: MainAxisSize.min,crossAxisAlignment: CrossAxisAlignment.stretch,children: [
                    Text('JudgeX',style: Theme.of(context).textTheme.displayMedium,textAlign: TextAlign.center),
                    const SizedBox(height: 8),
                    Text('Welcome back!',style: Theme.of(context).textTheme.bodyMedium,textAlign: TextAlign.center),
                    const SizedBox(height: 32),
                    TextFormField(controller: _emailController,keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email',prefixIcon: Icon(Icons.email_outlined),border: OutlineInputBorder()),
                      validator: (value) {if (value == null || value.isEmpty) return 'Please enter your email';
                        if (!value.contains('@')) return 'Please enter a valid email';return null;}),
                    const SizedBox(height: 16),
                    TextFormField(controller: _passwordController,obscureText: _obscurePassword,
                      decoration: InputDecoration(labelText: 'Password',prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword)),border: const OutlineInputBorder()),
                      validator: (value) {if (value == null || value.isEmpty) return 'Please enter your password';
                        if (value.length < 6) return 'Password must be at least 6 characters';return null;}),
                    const SizedBox(height: 24),
                    Consumer<AuthProvider>(builder: (context, authProvider, _) =>
                      GradientButton(text: 'Login',onPressed: _handleLogin,isLoading: authProvider.isLoading)),
                    const SizedBox(height: 16),
                    TextButton(onPressed: () => context.go('/register'),child: const Text("Don't have an account? Register"))
                  ]))))))));
  }
}
