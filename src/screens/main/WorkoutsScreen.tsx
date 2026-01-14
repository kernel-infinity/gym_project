import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../context/LocalAuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAllWorkouts, deleteWorkout } from '../../database/localServices';
import { Workout } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutStackParamList } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

type WorkoutsScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'WorkoutsList'>;

interface WorkoutsScreenProps {
  navigation: WorkoutsScreenNavigationProp;
}

export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const loadWorkouts = () => {
    if (!user) return;
    const allWorkouts = getAllWorkouts(user.id);
    setWorkouts(allWorkouts);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkouts();
    setRefreshing(false);
  };

  const handleDeleteWorkout = (id: number, name: string) => {
    Alert.alert(
      'Obriši trening',
      `Da li si siguran da želiš obrisati "${name}"?`,
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: () => {
            deleteWorkout(id);
            loadWorkouts();
          },
        },
      ]
    );
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Moji treninzi</Text>
          <Button
            title="+ Novi trening"
            onPress={() => navigation.navigate('CreateWorkout')}
          />
        </View>

        {workouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nemaš još treninga</Text>
            <Text style={styles.emptySubtext}>Kreiraj svoj prvi trening program</Text>
          </Card>
        ) : (
          workouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
            >
              <Card style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    {workout.notes && (
                      <Text style={styles.workoutNotes}>{workout.notes}</Text>
                    )}
                    {workout.scheduled_at && (
                      <Text style={styles.workoutDate}>
                        {new Date(workout.scheduled_at).toLocaleDateString('sr-RS')}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(workout.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusText(workout.status)}</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWorkout(workout.id, workout.name)}
                  >
                    <Text style={styles.deleteText}>Obriši</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  emptyCard: {
    marginHorizontal: 24,
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  workoutCard: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
    marginRight: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  deleteText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});
