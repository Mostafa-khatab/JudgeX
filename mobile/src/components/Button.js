import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, typography, spacing, shadows } from '../theme/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, google
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGoogle = variant === 'google';
  const isSecondary = variant === 'secondary';

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.background : colors.primary} />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.text,
              isPrimary && styles.primaryText,
              isOutline && styles.outlineText,
              isGoogle && styles.googleText,
              isSecondary && styles.secondaryText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (isPrimary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.buttonContainer, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles.primaryButton, disabled && styles.disabled]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        isOutline && styles.outlineButton,
        isGoogle && styles.googleButton,
        isSecondary && styles.secondaryButton,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    ...shadows.button,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  googleButton: {
    backgroundColor: colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  primaryText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
  googleText: {
    color: '#1F1F1F',
  },
});

export default Button;
