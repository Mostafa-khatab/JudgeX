import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import Logo from '../components/Logo';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // Navigation will be handled by AuthContext
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Login', 'Google authentication will be implemented with expo-auth-session');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented');
  };

  const handleVerifyEmail = () => {
    Alert.alert('Verify Email', 'Email verification functionality will be implemented');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Logo size={40} />
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Login Card */}
        <Card style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Input Fields */}
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Action Links */}
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleVerifyEmail}>
              <Text style={styles.linkSecondary}>Verify Email</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button and Google */}
          <View style={styles.buttonRow}>
            <Button
              title="Log in"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
              <Text style={styles.googleIcon}>G</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}>Log in</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  menuButton: {
    padding: spacing.sm,
  },
  menuIcon: {
    color: colors.text,
    fontSize: typography.sizes.xl,
  },
  card: {
    marginHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  link: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  linkSecondary: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  loginButton: {
    flex: 1,
  },
  googleButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#4285F4',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});

export default LoginScreen;
