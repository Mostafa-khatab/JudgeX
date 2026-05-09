import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { Home, Trophy, LayoutGrid, Map, Brain, MessageSquare, Clock } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/theme';

// Screens
import IndexScreen from '../screens/IndexScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ContestsScreen from '../screens/ContestsScreen';
import ContestDetailScreen from '../screens/ContestDetailScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import ProblemDetailScreen from '../screens/ProblemDetailScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
import AILabScreen from '../screens/AILabScreen';
import BlogsScreen from '../screens/BlogsScreen';
import SubmitCodeScreen from '../screens/SubmitCodeScreen';
import SubmissionsScreen from '../screens/SubmissionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ Icon, focused, color }) => {
  if (!Icon) return null;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#18181b', borderBottomWidth: 1, borderBottomColor: '#27272a' },
      headerTitleStyle: { color: '#ffffff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, fontSize: 16 },
      tabBarStyle: {
        backgroundColor: '#18181b',
        borderTopColor: '#27272a',
        height: 65,
        paddingBottom: 10,
      },
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#71717a',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -5 },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeScreen}
      options={{
        title: 'Home',
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />,
      }}
    />
    <Tab.Screen
      name="ContestsTab"
      component={ContestsScreen}
      options={{
        title: 'Contests',
        tabBarLabel: 'Contests',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Trophy} color={color} focused={focused} />,
      }}
    />
    <Tab.Screen
      name="ProblemsTab"
      component={ProblemsScreen}
      options={{
        title: 'Problems',
        tabBarLabel: 'All',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={LayoutGrid} color={color} focused={focused} />,
      }}
    />
    <Tab.Screen
      name="RoadmapTab"
      component={RoadmapScreen}
      options={{
        title: 'Roadmap',
        tabBarLabel: 'Map',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Map} color={color} focused={focused} />,
      }}
    />
    <Tab.Screen
      name="AILabTab"
      component={AILabScreen}
      options={{
        title: 'AI Laboratory',
        tabBarLabel: 'AI Lab',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Brain} color={color} focused={focused} />,
      }}
    />
    <Tab.Screen
      name="SubmissionsTab"
      component={SubmissionsScreen}
      options={{
        title: 'My Submissions',
        tabBarLabel: 'History',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Clock} color={color} focused={focused} />,
      }}
    />
    <Tab.Screen
      name="BlogsTab"
      component={BlogsScreen}
      options={{
        title: 'Community',
        tabBarLabel: 'Blogs',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={MessageSquare} color={color} focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Index" component={IndexScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="ContestDetail" component={ContestDetailScreen} />
    <Stack.Screen name="ProblemDetail" component={ProblemDetailScreen} />
    <Stack.Screen name="SubmitCode" component={SubmitCodeScreen} />
    <Stack.Screen name="Submissions" component={SubmissionsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();

  console.log('AppNavigator: isLoading =', isLoading, 'isAuthenticated =', isAuthenticated);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Auth...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
