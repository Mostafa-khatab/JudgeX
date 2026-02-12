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
  Image,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import Logo from '../components/Logo';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const SignUpScreen = ({ navigation }) => {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength checks
  const passwordChecks = {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLabel = passedChecks <= 1 ? 'Very Weak' : passedChecks <= 2 ? 'Weak' : passedChecks <= 3 ? 'Medium' : passedChecks <= 4 ? 'Strong' : 'Very Strong';
  const strengthColor = passedChecks <= 1 ? colors.error : passedChecks <= 2 ? colors.warning : passedChecks <= 3 ? colors.warning : colors.success;

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (passedChecks < 3) {
      setError('Please use a stronger password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(username, email, password);
      // Navigation will be handled by AuthContext
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert('Google Sign Up', 'Google authentication will be implemented with expo-auth-session');
  };

  const CheckItem = ({ checked, label }) => (
    <View style={styles.checkItem}>
      <Text style={[styles.checkIcon, checked && styles.checkIconActive]}>
        {checked ? '✓' : '✗'}
      </Text>
      <Text style={[styles.checkLabel, checked && styles.checkLabelActive]}>{label}</Text>
    </View>
  );

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

        {/* Sign Up Card */}
        <Card style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          {/* Google Button */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Input Fields */}
          <Input
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon={<Text style={styles.inputIcon}>👤</Text>}
          />

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Text style={styles.inputIcon}>✉️</Text>}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Text style={styles.inputIcon}>🔒</Text>}
          />

          {/* Password Strength */}
          <View style={styles.strengthContainer}>
            <Text style={styles.strengthLabel}>Password Strength</Text>
            <Text style={[styles.strengthValue, { color: strengthColor }]}>{strengthLabel}</Text>
          </View>

          {/* Strength Bars */}
          <View style={styles.strengthBars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthBar,
                  { backgroundColor: i <= passedChecks ? strengthColor : colors.inputBorder },
                ]}
              />
            ))}
          </View>

          {/* Password Checks */}
          <View style={styles.checksContainer}>
            <CheckItem checked={passwordChecks.minLength} label="At least 6 characters" />
            <CheckItem checked={passwordChecks.hasUppercase} label="Contains uppercase letter" />
            <CheckItem checked={passwordChecks.hasLowercase} label="Contains lowercase letter" />
            <CheckItem checked={passwordChecks.hasNumber} label="Contains number" />
            <CheckItem checked={passwordChecks.hasSpecial} label="Contains special character" />
          </View>

          {/* Sign Up Button */}
          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            style={styles.submitButton}
          />

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  googleIcon: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#4285F4',
  },
  googleText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: '#1F1F1F',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputIcon: {
    fontSize: typography.sizes.lg,
  },
  strengthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  strengthLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  strengthValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  checksContainer: {
    marginBottom: spacing.lg,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  checkIcon: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginRight: spacing.sm,
    width: 16,
  },
  checkIconActive: {
    color: colors.success,
  },
  checkLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  checkLabelActive: {
    color: colors.textSecondary,
  },
  submitButton: {
    marginBottom: spacing.lg,
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
  link: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});

export default SignUpScreen;
