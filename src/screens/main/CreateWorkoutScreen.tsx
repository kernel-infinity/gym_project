import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../../context/LocalAuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  createWorkout,
  createWorkoutExercise,
  createExerciseSet,
  getAllExercises,
} from '../../database/localServices';
import { Exercise } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutStackParamList } from '../../types';

type CreateWorkoutScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'CreateWorkout'>;

interface CreateWorkoutScreenProps {
  navigation: CreateWorkoutScreenNavigationProp;
}

interface SelectedExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  weight: number;
}

export const CreateWorkoutScreen: React.FC<CreateWorkoutScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = () => {
    const exercises = getAllExercises();
    setAllExercises(exercises);
  };

  const handleAddExercise = (exercise: Exercise) => {
    setSelectedExercises([
      ...selectedExercises,
      { exercise, sets: 3, reps: 10, weight: 0 },
    ]);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleCreateWorkout = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Greška', 'Molimo unesite ime treninga');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Greška', 'Dodajte barem jednu vježbu');
      return;
    }

    setLoading(true);

    try {
      // Create workout
      const workout = createWorkout({
        user_id: user.id,
        name: name.trim(),
        notes: notes.trim() || undefined,
        status: 'planned',
        scheduled_at: new Date().toISOString(),
      });

      if (!workout) {
        throw new Error('Failed to create workout');
      }

      // Add exercises and sets
      for (let i = 0; i < selectedExercises.length; i++) {
        const { exercise, sets, reps, weight } = selectedExercises[i];

        const workoutExercise = createWorkoutExercise({
          workout_id: workout.id,
          exercise_id: exercise.id,
          order_num: i + 1,
        });

        if (workoutExercise) {
          // Create sets for this exercise
          for (let j = 1; j <= sets; j++) {
            createExerciseSet({
              workout_exercise_id: workoutExercise.id,
              set_number: j,
              weight,
              reps,
              completed: false,
            });
          }
        }
      }

      Alert.alert('Uspjeh', 'Trening kreiran!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating workout:', error);
      Alert.alert('Greška', 'Greška pri kreiranju treninga');
    } finally {
      setLoading(false);
    }
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exercisePickerItem}
      onPress={() => handleAddExercise(item)}
    >
      <View>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseGroup}>{item.muscle_group}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Input
            label="Ime treninga"
            value={name}
            onChangeText={setName}
            placeholder="npr. Push Day, Leg Day..."
          />

          <Input
            label="Bilješke (opcionalno)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Dodatne informacije..."
            multiline
            numberOfLines={3}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vježbe</Text>
            <Button
              title="+ Dodaj vježbu"
              onPress={() => setShowExercisePicker(true)}
              variant="secondary"
            />
          </View>

          {selectedExercises.map((item, index) => (
            <Card key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.exerciseDetails}>
                {item.sets} setova × {item.reps} ponavljanja
                {item.weight > 0 && ` @ ${item.weight}kg`}
              </Text>
            </Card>
          ))}

          <Button
            title="Kreiraj trening"
            onPress={handleCreateWorkout}
            loading={loading}
            disabled={selectedExercises.length === 0}
            style={styles.createButton}
          />
        </View>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        animationType="slide"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Izaberi vježbu</Text>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={allExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.exerciseList}
          />
        </View>
      </Modal>
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
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  exerciseCard: {
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  exerciseGroup: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  removeText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  createButton: {
    marginTop: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    fontSize: 24,
    color: '#8E8E93',
  },
  exerciseList: {
    padding: 24,
  },
  exercisePickerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
