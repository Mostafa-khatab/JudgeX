import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors, typography } from '../theme/theme';

// Screens
import IndexScreen from '../screens/IndexScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ContestsScreen from '../screens/ContestsScreen';
import ContestDetailScreen from '../screens/ContestDetailScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import ProblemDetailScreen from '../screens/ProblemDetailScreen';
import SubmitCodeScreen from '../screens/SubmitCodeScreen';
import SubmissionsScreen from '../screens/SubmissionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

// Bottom Tab Navigator (Main App Tabs)
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.cardBackground,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarShowLabel: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="ProblemsTab"
      component={ProblemsScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="📝" label="Problems" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

// Auth Stack (not logged in)
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="Index" component={IndexScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// App Stack (logged in)
const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Contests" component={ContestsScreen} />
    <Stack.Screen name="ContestDetail" component={ContestDetailScreen} />
    <Stack.Screen name="Problems" component={ProblemsScreen} />
    <Stack.Screen name="ProblemDetail" component={ProblemDetailScreen} />
    <Stack.Screen name="SubmitCode" component={SubmitCodeScreen} />
    <Stack.Screen name="Submissions" component={SubmissionsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabIconFocused: {},
  tabLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
});

export default AppNavigator;
