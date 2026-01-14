import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/LocalAuthContext';
import { RootStackParamList, MainTabParamList, WorkoutStackParamList } from '../types';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Main Screens
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { WorkoutsScreen } from '../screens/main/WorkoutsScreen';
import { CreateWorkoutScreen } from '../screens/main/CreateWorkoutScreen';
import { WorkoutDetailScreen } from '../screens/main/WorkoutDetailScreen';
import { WeeklyGoalsScreen } from '../screens/main/WeeklyGoalsScreen';
import { BodyMetricsScreen } from '../screens/main/BodyMetricsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { View, Text, StyleSheet } from 'react-native';

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const WorkoutStack = createStackNavigator<WorkoutStackParamList>();

// Workout Stack Navigator
const WorkoutsNavigator = () => {
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <WorkoutStack.Screen
        name="WorkoutsList"
        component={WorkoutsScreen}
        options={{ headerShown: false }}
      />
      <WorkoutStack.Screen
        name="CreateWorkout"
        component={CreateWorkoutScreen}
        options={{ title: 'Novi trening' }}
      />
      <WorkoutStack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{ title: 'Detalji treninga' }}
      />
      <WorkoutStack.Screen
        name="WeeklyGoals"
        component={WeeklyGoalsScreen}
        options={{ title: 'Sedmični ciljevi' }}
      />
      <WorkoutStack.Screen
        name="BodyMetrics"
        component={BodyMetricsScreen}
        options={{ title: 'Tjelesne metrike' }}
      />
    </WorkoutStack.Navigator>
  );
};

// Tab Icon Component
const TabIcon: React.FC<{ focused: boolean; label: string }> = ({ focused, label }) => {
  const icons: { [key: string]: string } = {
    Dashboard: '🏠',
    Workouts: '💪',
    Profile: '👤',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={styles.tabIcon}>{icons[label]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label === 'Dashboard' ? 'Početna' : label === 'Workouts' ? 'Treninzi' : 'Profil'}
      </Text>
    </View>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#1C1C1E',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 28,
        },
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'GymPal',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Dashboard" />,
        }}
      />
      <MainTab.Screen
        name="Workouts"
        component={WorkoutsNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Workouts" />,
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" />,
        }}
      />
    </MainTab.Navigator>
  );
};

// Root Navigator
export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  tabLabelFocused: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
