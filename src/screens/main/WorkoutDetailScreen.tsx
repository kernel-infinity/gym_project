import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getWorkoutById,
  getWorkoutExercises,
  updateWorkout,
  updateExerciseSet,
} from '../../database/localServices';
import { Workout, WorkoutExercise, ExerciseSet } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { WorkoutStackParamList } from '../../types';

type WorkoutDetailScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'WorkoutDetail'>;
type WorkoutDetailScreenRouteProp = RouteProp<WorkoutStackParamList, 'WorkoutDetail'>;

interface WorkoutDetailScreenProps {
  navigation: WorkoutDetailScreenNavigationProp;
  route: WorkoutDetailScreenRouteProp;
}

export const WorkoutDetailScreen: React.FC<WorkoutDetailScreenProps> = ({ navigation, route }) => {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);

  useEffect(() => {
    loadWorkoutDetails();
  }, [workoutId]);

  const loadWorkoutDetails = () => {
    const workoutData = getWorkoutById(workoutId);
    setWorkout(workoutData);

    if (workoutData) {
      const exercises = getWorkoutExercises(workoutData.id);
      setWorkoutExercises(exercises);
    }
  };

  const handleStartWorkout = () => {
    if (!workout) return;

    updateWorkout(workout.id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    loadWorkoutDetails();
    Alert.alert('Uspjeh', 'Trening započet! Vrijeme je da treniraš!');
  };

  const handleCompleteWorkout = () => {
    if (!workout) return;

    Alert.alert(
      'Završi trening',
      'Da li si siguran da želiš završiti trening?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Završi',
          onPress: () => {
            updateWorkout(workout.id, {
              status: 'completed',
              completed_at: new Date().toISOString(),
            });
            loadWorkoutDetails();
            Alert.alert('Čestitamo!', 'Trening uspješno završen!');
          },
        },
      ]
    );
  };

  const handleToggleSet = (setId: number, completed: boolean) => {
    updateExerciseSet(setId, { completed: !completed });
    loadWorkoutDetails();
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

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Trening nije pronađen</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{workout.name}</Text>
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
          <Card style={styles.notesCard}>
            <Text style={styles.notesTitle}>Bilješke</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </Card>
        )}

        {workoutExercises.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nema vježbi u ovom treningu</Text>
          </Card>
        ) : (
          workoutExercises.map((we) => (
            <Card key={we.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{we.exercise?.name}</Text>
              {we.exercise?.muscle_group && (
                <Text style={styles.muscleGroup}>{we.exercise.muscle_group}</Text>
              )}

              {we.sets && we.sets.length > 0 && (
                <View style={styles.setsContainer}>
                  {we.sets.map((set: ExerciseSet) => (
                    <View
                      key={set.id}
                      style={[
                        styles.setRow,
                        set.completed && styles.setRowCompleted,
                      ]}
                    >
                      <Text style={styles.setNumber}>Set {set.set_number}</Text>
                      <Text style={styles.setDetails}>
                        {set.weight ? `${set.weight}kg × ` : ''}
                        {set.reps} reps
                        {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                      </Text>
                      {workout.status === 'in_progress' && (
                        <Button
                          title={set.completed ? '✓' : '○'}
                          onPress={() => handleToggleSet(set.id, set.completed)}
                          variant={set.completed ? 'primary' : 'secondary'}
                          style={styles.setButton}
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))
        )}

        <View style={styles.actions}>
          {workout.status === 'planned' && (
            <Button
              title="Započni trening"
              onPress={handleStartWorkout}
            />
          )}

          {workout.status === 'in_progress' && (
            <Button
              title="Završi trening"
              onPress={handleCompleteWorkout}
            />
          )}

          {workout.status === 'completed' && workout.completed_at && (
            <Card style={styles.completedCard}>
              <Text style={styles.completedText}>
                Završeno: {new Date(workout.completed_at).toLocaleString('sr-RS')}
              </Text>
            </Card>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notesCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  emptyCard: {
    marginHorizontal: 24,
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  exerciseCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
  },
  setsContainer: {
    marginTop: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 6,
  },
  setRowCompleted: {
    backgroundColor: '#D1F2EB',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 60,
  },
  setDetails: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  setButton: {
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  actions: {
    padding: 24,
  },
  completedCard: {
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 48,
  },
});
