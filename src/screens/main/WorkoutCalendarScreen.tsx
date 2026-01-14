import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Workout } from '../../types';
import { useAuth } from '../../context/LocalAuthContext';
import { getAllWorkouts, getWorkoutsByDate, updateWorkout } from '../../database/localServices';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutStackParamList } from '../../types';

type NavigationProp = StackNavigationProp<WorkoutStackParamList>;

export const WorkoutCalendarScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutsForDate, setWorkoutsForDate] = useState<Workout[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    loadWorkouts();
  }, []);

  useEffect(() => {
    loadWorkoutsForDate(selectedDate);
  }, [selectedDate, allWorkouts]);

  const loadWorkouts = () => {
    if (!user) return;
    const workouts = getAllWorkouts(user.id);
    setAllWorkouts(workouts);
    generateMarkedDates(workouts);
  };

  const loadWorkoutsForDate = (date: string) => {
    if (!user) return;
    const workouts = getWorkoutsByDate(user.id, date);
    setWorkoutsForDate(workouts);
  };

  const generateMarkedDates = (workouts: Workout[]) => {
    const marked: any = {};

    workouts.forEach(workout => {
      if (workout.scheduled_at) {
        const date = workout.scheduled_at.split('T')[0];
        const status = workout.status;

        if (!marked[date]) {
          marked[date] = {
            marked: true,
            dots: []
          };
        }

        let color = '#3b82f6'; // planned - blue
        if (status === 'completed') {
          color = '#22c55e'; // completed - green
        } else if (status === 'in_progress') {
          color = '#f59e0b'; // in_progress - orange
        }

        marked[date].dots.push({ color });
      }
    });

    // Add selection
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#007AFF',
      };
    }

    setMarkedDates(marked);
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const updatedMarked = { ...markedDates };

    Object.keys(updatedMarked).forEach(date => {
      if (updatedMarked[date].selected) {
        delete updatedMarked[date].selected;
        delete updatedMarked[date].selectedColor;
      }
    });

    updatedMarked[day.dateString] = {
      ...updatedMarked[day.dateString],
      selected: true,
      selectedColor: '#007AFF',
    };

    setMarkedDates(updatedMarked);
  };

  const handleCreateWorkout = () => {
    navigation.navigate('CreateWorkout');
  };

  const handleWorkoutPress = (workoutId: number) => {
    navigation.navigate('WorkoutDetail', { workoutId });
  };

  const handleMarkAsCompleted = (workout: Workout) => {
    Alert.alert(
      'Označi kao završeno',
      `Jeste li sigurni da ste završili "${workout.name}"?`,
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Da',
          onPress: () => {
            updateWorkout(workout.id, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });
            loadWorkouts();
          }
        }
      ]
    );
  };

  const handleStartWorkout = (workout: Workout) => {
    updateWorkout(workout.id, {
      status: 'in_progress',
      started_at: new Date().toISOString()
    });
    loadWorkouts();
    navigation.navigate('WorkoutDetail', { workoutId: workout.id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'in_progress':
        return '#f59e0b';
      case 'planned':
      default:
        return '#3b82f6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Završeno';
      case 'in_progress':
        return 'U tijeku';
      case 'planned':
      default:
        return 'Planirano';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kalendar treninga</Text>
        <Button title="+ Novi" onPress={handleCreateWorkout} />
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#666',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#007AFF',
          dayTextColor: '#333',
          textDisabledColor: '#d9d9d9',
          dotColor: '#007AFF',
          selectedDotColor: '#ffffff',
          arrowColor: '#007AFF',
          monthTextColor: '#333',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Planirano</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>U tijeku</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Završeno</Text>
        </View>
      </View>

      <ScrollView style={styles.workoutsSection}>
        <Text style={styles.sectionTitle}>
          Treninzi za {new Date(selectedDate).toLocaleDateString('hr-HR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </Text>

        {workoutsForDate.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nema planiranih treninga za ovaj dan</Text>
            <Button
              title="Dodaj trening"
              onPress={handleCreateWorkout}
              style={{ marginTop: 12 }}
            />
          </Card>
        ) : (
          workoutsForDate.map(workout => (
            <Card key={workout.id} style={styles.workoutCard}>
              <TouchableOpacity
                onPress={() => handleWorkoutPress(workout.id)}
                style={styles.workoutContent}
              >
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutTitleRow}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workout.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(workout.status)}</Text>
                    </View>
                  </View>
                  {workout.scheduled_at && (
                    <Text style={styles.workoutTime}>
                      {new Date(workout.scheduled_at).toLocaleTimeString('hr-HR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  )}
                </View>
                {workout.notes && (
                  <Text style={styles.workoutNotes}>{workout.notes}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.workoutActions}>
                {workout.status === 'planned' && (
                  <Button
                    title="Započni"
                    onPress={() => handleStartWorkout(workout)}
                    variant="secondary"
                    style={styles.actionButton}
                  />
                )}
                {workout.status !== 'completed' && (
                  <Button
                    title="Završi"
                    onPress={() => handleMarkAsCompleted(workout)}
                    style={styles.actionButton}
                  />
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  workoutsSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  workoutCard: {
    padding: 16,
    marginBottom: 12,
  },
  workoutContent: {
    marginBottom: 12,
  },
  workoutHeader: {
    marginBottom: 8,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  workoutTime: {
    fontSize: 14,
    color: '#666',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#888',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
