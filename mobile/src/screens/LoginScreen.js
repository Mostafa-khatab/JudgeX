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
import { Mail, Lock, Eye, Moon, Loader2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
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
          {/* Header Logo */}
          <View style={styles.logoHeader}>
             <Logo size={48} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Sign In</Text>
            
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
               <Mail size={20} color="#8B949E" style={styles.inputIcon} />
               <TextInput
                 style={styles.textInput}
                 placeholder="Email Address"
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
                 secureTextEntry={!showPassword}
               />
               <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Eye size={20} color={showPassword ? "#0EA5E9" : "#8B949E"} />
               </TouchableOpacity>
            </View>

            <View style={styles.linksRow}>
               <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.linkText}>Forgot password?</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.linkText}>Verify Email</Text>
               </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? <Loader2 size={24} color="white" /> : <Text style={styles.loginButtonText}>Login</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    marginBottom: 40,
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
    fontSize: 32,
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
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 32,
  },
  linkText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
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
  signupLink: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;
