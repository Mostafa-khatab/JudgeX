import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Trophy, LayoutGrid, Map, Brain, MessageSquare } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ContestsScreen from '../screens/ContestsScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
import AILabScreen from '../screens/AILabScreen';
import BlogsScreen from '../screens/BlogsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: '#0a0a0a', borderBottomWidth: 0, elevation: 0 },
        headerTitleStyle: { color: '#ffffff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
        tabBarStyle: { 
          backgroundColor: '#0a0a0a', 
          borderTopColor: '#171717',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 },
        tabBarItemStyle: { paddingVertical: 4 },
      })}
    >
      <Tab.Screen 
        name="HOME" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} 
      />
      <Tab.Screen 
        name="CONTESTS" 
        component={ContestsScreen} 
        options={{ tabBarIcon: ({ color }) => <Trophy color={color} size={22} /> }} 
      />
      <Tab.Screen 
        name="PROBLEMS" 
        component={ProblemsScreen} 
        options={{ tabBarIcon: ({ color }) => <LayoutGrid color={color} size={22} /> }} 
      />
      <Tab.Screen 
        name="ROADMAP" 
        component={RoadmapScreen} 
        options={{ tabBarIcon: ({ color }) => <Map color={color} size={22} /> }} 
      />
      <Tab.Screen 
        name="AI LAB" 
        component={AILabScreen} 
        options={{ tabBarIcon: ({ color }) => <Brain color={color} size={22} /> }} 
      />
      <Tab.Screen 
        name="BLOGS" 
        component={BlogsScreen} 
        options={{ tabBarIcon: ({ color }) => <MessageSquare color={color} size={22} /> }} 
      />
    </Tab.Navigator>
  );
}
