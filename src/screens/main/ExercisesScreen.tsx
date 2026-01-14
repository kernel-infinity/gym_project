import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Exercise, MuscleGroup } from '../../types';
import {
  getAllExercises,
  getAllMuscleGroups,
  createExercise,
  updateExercise,
  deleteExercise
} from '../../database/localServices';

export const ExercisesScreen = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    muscle_group_id: 0,
    equipment: '',
    instructions: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExercises = getAllExercises();
    const groups = getAllMuscleGroups();
    setExercises(allExercises);
    setMuscleGroups(groups);
    if (groups.length > 0 && formData.muscle_group_id === 0) {
      setFormData(prev => ({ ...prev, muscle_group_id: groups[0].id }));
    }
  };

  const handleOpenModal = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name,
        description: exercise.description || '',
        muscle_group_id: exercise.muscle_group_id,
        equipment: exercise.equipment || '',
        instructions: exercise.instructions || ''
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: '',
        description: '',
        muscle_group_id: muscleGroups.length > 0 ? muscleGroups[0].id : 0,
        equipment: '',
        instructions: ''
      });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Greška', 'Molimo unesite naziv vježbe');
      return;
    }

    if (formData.muscle_group_id === 0) {
      Alert.alert('Greška', 'Molimo odaberite mišićnu skupinu');
      return;
    }

    try {
      if (editingExercise) {
        updateExercise(editingExercise.id, formData);
      } else {
        createExercise(formData);
      }
      loadData();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Greška', 'Došlo je do greške pri spremanju');
    }
  };

  const handleDelete = (exercise: Exercise) => {
    Alert.alert(
      'Potvrda brisanja',
      `Jeste li sigurni da želite obrisati "${exercise.name}"?`,
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: () => {
            try {
              deleteExercise(exercise.id);
              loadData();
            } catch (error) {
              Alert.alert('Greška', 'Ne možete obrisati vježbu koja se koristi u treninzima');
            }
          }
        }
      ]
    );
  };

  const getFilteredExercises = () => {
    if (selectedMuscleGroup === null) {
      return exercises;
    }
    return exercises.filter(ex => ex.muscle_group_id === selectedMuscleGroup);
  };

  const groupedExercises = muscleGroups.map(group => ({
    group,
    exercises: exercises.filter(ex => ex.muscle_group_id === group.id)
  })).filter(item => item.exercises.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vježbe</Text>
        <Button title="+ Dodaj" onPress={() => handleOpenModal()} />
      </View>

      <ScrollView horizontal style={styles.filterScroll} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, selectedMuscleGroup === null && styles.filterChipActive]}
          onPress={() => setSelectedMuscleGroup(null)}
        >
          <Text style={[styles.filterChipText, selectedMuscleGroup === null && styles.filterChipTextActive]}>
            Sve
          </Text>
        </TouchableOpacity>
        {muscleGroups.map(group => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.filterChip,
              selectedMuscleGroup === group.id && styles.filterChipActive,
              { borderColor: group.color }
            ]}
            onPress={() => setSelectedMuscleGroup(group.id)}
          >
            <View style={[styles.filterDot, { backgroundColor: group.color }]} />
            <Text style={[
              styles.filterChipText,
              selectedMuscleGroup === group.id && styles.filterChipTextActive
            ]}>
              {group.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView}>
        {selectedMuscleGroup === null ? (
          groupedExercises.map(({ group, exercises: groupExercises }) => (
            <View key={group.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: group.color }]} />
                <Text style={styles.sectionTitle}>{group.name}</Text>
              </View>
              {groupExercises.map(exercise => (
                <Card key={exercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {exercise.equipment && (
                      <Text style={styles.exerciseEquipment}>🏋️ {exercise.equipment}</Text>
                    )}
                    {exercise.description && (
                      <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                    )}
                  </View>
                  <View style={styles.exerciseActions}>
                    <TouchableOpacity
                      onPress={() => handleOpenModal(exercise)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(exercise)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.section}>
            {getFilteredExercises().map(exercise => (
              <Card key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.equipment && (
                    <Text style={styles.exerciseEquipment}>🏋️ {exercise.equipment}</Text>
                  )}
                  {exercise.description && (
                    <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                  )}
                </View>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity
                    onPress={() => handleOpenModal(exercise)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(exercise)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingExercise ? 'Uredi vježbu' : 'Nova vježba'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Naziv vježbe"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Mišićna skupina:</Text>
              <View style={styles.muscleGroupPicker}>
                {muscleGroups.map(group => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.muscleGroupOption,
                      formData.muscle_group_id === group.id && styles.muscleGroupOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, muscle_group_id: group.id })}
                  >
                    <View style={[styles.muscleGroupDot, { backgroundColor: group.color }]} />
                    <Text style={[
                      styles.muscleGroupText,
                      formData.muscle_group_id === group.id && styles.muscleGroupTextSelected
                    ]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Oprema (opcionalno)"
                value={formData.equipment}
                onChangeText={(text) => setFormData({ ...formData, equipment: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Opis (opcionalno)"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Upute (opcionalno)"
                value={formData.instructions}
                onChangeText={(text) => setFormData({ ...formData, instructions: text })}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Odustani"
                  onPress={() => setModalVisible(false)}
                  variant="secondary"
                />
                <Button title="Spremi" onPress={handleSave} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  filterScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxHeight: 60,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exerciseEquipment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#888',
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 60,
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  muscleGroupPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  muscleGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  muscleGroupOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  muscleGroupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  muscleGroupText: {
    fontSize: 14,
    color: '#666',
  },
  muscleGroupTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
