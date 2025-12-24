import 'package:flutter/material.dart';

class GradientButton extends StatelessWidget {
  final String text;final VoidCallback onPressed;final bool isLoading;final List<Color>? gradientColors;

  const GradientButton({super.key,required this.text,required this.onPressed,this.isLoading = false,this.gradientColors});

  @override
  Widget build(BuildContext context) {
    final colors = gradientColors ?? [const Color(0xFF6366F1),const Color(0xFF8B5CF6)];
    return Container(decoration: BoxDecoration(gradient: LinearGradient(colors: colors),borderRadius: BorderRadius.circular(8),
        boxShadow: [BoxShadow(color: colors[0].withOpacity(0.3),blurRadius: 8,offset: const Offset(0, 4))]),
      child: Material(color: Colors.transparent,
        child: InkWell(onTap: isLoading ? null : onPressed,borderRadius: BorderRadius.circular(8),
          child: Container(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),alignment: Alignment.center,
            child: isLoading ? const SizedBox(height: 20,width: 20,child: CircularProgressIndicator(strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white))) :
              Text(text,style: const TextStyle(color: Colors.white,fontSize: 16,fontWeight: FontWeight.w600))))));
  }
}
