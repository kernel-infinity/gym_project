import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../context/LocalAuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getCurrentWeeklyGoal, getAllWorkouts, getLatestBodyMetric } from '../../database/localServices';
import { WeeklyGoal, Workout, BodyMetric } from '../../types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, WorkoutStackParamList } from '../../types';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<WorkoutStackParamList>
>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [latestMetric, setLatestMetric] = useState<BodyMetric | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    if (!user) return;

    const goal = getCurrentWeeklyGoal(user.id);
    setWeeklyGoal(goal);

    const workouts = getAllWorkouts(user.id).slice(0, 5);
    setRecentWorkouts(workouts);

    const metric = getLatestBodyMetric(user.id);
    setLatestMetric(metric);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    setRefreshing(false);
  };

  const getProgressPercentage = () => {
    if (!weeklyGoal) return 0;
    return Math.min((weeklyGoal.completed_workouts / weeklyGoal.target_workouts) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Završeno';
      case 'in_progress':
        return 'U toku';
      default:
        return 'Planirano';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Zdravo, {user?.name}! 👋</Text>
        <Text style={styles.subtitle}>Vreme je za trening</Text>
      </View>

      {/* Weekly Goal Card */}
      {weeklyGoal && (
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.cardTitle}>Sedmični cilj</Text>
            <Text style={styles.goalCount}>
              {weeklyGoal.completed_workouts}/{weeklyGoal.target_workouts}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getProgressPercentage())}% kompletno
          </Text>
        </Card>
      )}

      {/* Body Metrics Card */}
      {latestMetric && (
        <Card>
          <Text style={styles.cardTitle}>Trenutne metrike</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{latestMetric.weight} kg</Text>
              <Text style={styles.metricLabel}>Težina</Text>
            </View>
            {latestMetric.body_fat_percentage && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{latestMetric.body_fat_percentage}%</Text>
                <Text style={styles.metricLabel}>Mast</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Recent Workouts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nedavni treninzi</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Workouts' as any)}>
            <Text style={styles.seeAllText}>Vidi sve</Text>
          </TouchableOpacity>
        </View>

        {recentWorkouts.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nema treninga</Text>
            <Button
              title="Kreiraj prvi trening"
              onPress={() => navigation.navigate('Workouts' as any)}
              style={styles.createButton}
            />
          </Card>
        ) : (
          recentWorkouts.map((workout) => (
            <Card key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(workout.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{getStatusText(workout.status)}</Text>
                </View>
              </View>
              {workout.notes && (
                <Text style={styles.workoutNotes}>{workout.notes}</Text>
              )}
              {workout.scheduled_at && (
                <Text style={styles.workoutDate}>
                  {new Date(workout.scheduled_at).toLocaleDateString('sr-RS')}
                </Text>
              )}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  goalCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  goalCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    marginTop: 8,
  },
  workoutCard: {
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
