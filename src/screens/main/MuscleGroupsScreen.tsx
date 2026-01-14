import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MuscleGroup } from '../../types';
import { getAllMuscleGroups, createMuscleGroup, updateMuscleGroup, deleteMuscleGroup } from '../../database/localServices';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export const MuscleGroupsScreen = () => {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MuscleGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  useEffect(() => {
    loadMuscleGroups();
  }, []);

  const loadMuscleGroups = () => {
    const groups = getAllMuscleGroups();
    setMuscleGroups(groups);
  };

  const handleOpenModal = (group?: MuscleGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        color: group.color
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6'
      });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Greška', 'Molimo unesite naziv mišićne skupine');
      return;
    }

    try {
      if (editingGroup) {
        updateMuscleGroup(editingGroup.id, formData);
      } else {
        createMuscleGroup(formData);
      }
      loadMuscleGroups();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Greška', 'Došlo je do greške pri spremanju');
    }
  };

  const handleDelete = (group: MuscleGroup) => {
    Alert.alert(
      'Potvrda brisanja',
      `Jeste li sigurni da želite obrisati "${group.name}"?`,
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: () => {
            try {
              deleteMuscleGroup(group.id);
              loadMuscleGroups();
            } catch (error) {
              Alert.alert('Greška', 'Ne možete obrisati mišićnu skupinu koja ima pridružene vježbe');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Mišićne skupine</Text>
          <Button title="+ Dodaj" onPress={() => handleOpenModal()} />
        </View>

        <View style={styles.groupsGrid}>
          {muscleGroups.map(group => (
            <Card key={group.id} style={styles.groupCard}>
              <View style={[styles.colorIndicator, { backgroundColor: group.color }]} />
              <View style={styles.groupContent}>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.description && (
                  <Text style={styles.groupDescription}>{group.description}</Text>
                )}
              </View>
              <View style={styles.groupActions}>
                <TouchableOpacity
                  onPress={() => handleOpenModal(group)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(group)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGroup ? 'Uredi mišićnu skupinu' : 'Nova mišićna skupina'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Naziv (npr. Prsa, Leđa...)"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Opis (opcionalno)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.colorLabel}>Boja:</Text>
            <View style={styles.colorPicker}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    formData.color === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, color })}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Odustani"
                onPress={() => setModalVisible(false)}
                variant="secondary"
              />
              <Button title="Spremi" onPress={handleSave} />
            </View>
          </View>
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
  scrollView: {
    flex: 1,
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
  groupsGrid: {
    padding: 16,
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  colorIndicator: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  groupContent: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
  },
  groupActions: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
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
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
    borderWidth: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
});
