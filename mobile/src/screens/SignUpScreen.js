import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Mail, Lock, User, Eye, X, Moon, Check, Loader2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const SignUpScreen = ({ navigation }) => {
  const { signup } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const criteria = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /\d/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*()_+{}[\]:;<>,.?/~\\-]/.test(password) },
  ];

  const metCount = criteria.filter(c => c.met).length;
  
  const getStrengthText = () => {
    if (password.length === 0) return 'Very Weak';
    if (metCount <= 1) return 'Very Weak';
    if (metCount === 2) return 'Weak';
    if (metCount === 3) return 'Fair';
    if (metCount === 4) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (password.length === 0) return '#30363D';
    if (metCount <= 2) return '#F85149';
    if (metCount === 3) return '#D29922';
    return '#3FB950';
  };

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(username, email, password);
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Decorative Glow */}
      <View style={styles.backgroundGlow} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerWrapper}>
          <View style={styles.logoHeader}>
             <Logo size={48} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            
            <TouchableOpacity style={styles.googleButton} onPress={() => {}}>
               <Text style={styles.googleIcon}>G</Text>
               <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
               <View style={styles.dividerLine} />
               <Text style={styles.dividerText}>OR</Text>
               <View style={styles.dividerLine} />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputWrapper}>
               <User size={20} color="#8B949E" style={styles.inputIcon} />
               <TextInput
                 style={styles.textInput}
                 placeholder="Username"
                 placeholderTextColor="#8B949E"
                 value={username}
                 onChangeText={setUsername}
                 autoCapitalize="none"
               />
            </View>

            <View style={styles.inputWrapper}>
               <Mail size={20} color="#8B949E" style={styles.inputIcon} />
               <TextInput
                 style={styles.textInput}
                 placeholder="Email"
                 placeholderTextColor="#8B949E"
                 value={email}
                 onChangeText={setEmail}
                 autoCapitalize="none"
                 keyboardType="email-address"
               />
            </View>

            <View style={styles.inputWrapper}>
               <Lock size={20} color="#8B949E" style={styles.inputIcon} />
               <TextInput
                 style={styles.textInput}
                 placeholder="Password"
                 placeholderTextColor="#8B949E"
                 value={password}
                 onChangeText={setPassword}
                 secureTextEntry
               />
               <TouchableOpacity>
                  <Eye size={20} color="#8B949E" />
               </TouchableOpacity>
            </View>

            {/* Password Strength Section */}
            <View style={styles.strengthSection}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>Password Strength</Text>
                <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
                  {getStrengthText()}
                </Text>
              </View>
              <View style={styles.strengthBars}>
                 {[1, 2, 3, 4, 5].map((i) => (
                   <View 
                     key={i} 
                     style={[
                       styles.strengthBar, 
                       { backgroundColor: i <= metCount ? getStrengthColor() : '#1F2937' }
                     ]} 
                   />
                 ))}
              </View>
              <View style={styles.criteriaList}>
                {criteria.map((item, idx) => (
                  <View key={idx} style={styles.criteriaItem}>
                    {item.met ? (
                      <Check size={14} color="#3FB950" style={styles.criteriaIcon} />
                    ) : (
                      <X size={14} color="#4B5563" style={styles.criteriaIcon} />
                    )}
                    <Text style={[styles.criteriaText, item.met && styles.criteriaTextMet]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.signupButton} 
              onPress={handleSignUp}
              disabled={loading}
            >
               <LinearGradient
                 colors={['#0EA5E9', '#0284C7']}
                 style={styles.gradientButton}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
               >
                  {loading ? <Loader2 size={24} color="white" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
               </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070A',
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  backgroundGlow: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    borderRadius: 150,
  },
  logoHeader: {
    marginBottom: 30,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0 10px 20px rgba(0, 0, 0, 0.5)' }
    }),
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0EA5E9',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 24,
  },
  googleIcon: {
    color: '#4285F4',
    fontWeight: '900',
    fontSize: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  errorText: {
    color: '#FF453A',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  strengthSection: {
    marginBottom: 24,
    marginTop: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  strengthLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  criteriaList: {
    gap: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaIcon: {
    marginRight: 10,
  },
  criteriaText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  criteriaTextMet: {
    color: '#3FB950',
  },
  signupButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 32,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SignUpScreen;


