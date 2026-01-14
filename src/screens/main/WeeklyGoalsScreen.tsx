import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/LocalAuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getCurrentWeeklyGoal, createWeeklyGoal, updateWeeklyGoal, getAllWeeklyGoals } from '../../database/localServices';
import { WeeklyGoal } from '../../types';

export const WeeklyGoalsScreen: React.FC = () => {
  const { user } = useAuth();
  const [currentGoal, setCurrentGoal] = useState<WeeklyGoal | null>(null);
  const [targetWorkouts, setTargetWorkouts] = useState('4');
  const [notes, setNotes] = useState('');
  const [pastGoals, setPastGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    if (!user) return;

    const goal = getCurrentWeeklyGoal(user.id);
    setCurrentGoal(goal);

    if (goal) {
      setTargetWorkouts(goal.target_workouts.toString());
      setNotes(goal.notes || '');
    }

    const allGoals = getAllWeeklyGoals(user.id);
    setPastGoals(allGoals.slice(1)); // Skip current goal
  };

  const handleSaveGoal = () => {
    if (!user) return;

    const target = parseInt(targetWorkouts);
    if (isNaN(target) || target < 1) {
      Alert.alert('Greška', 'Molimo unesite validan broj treninga');
      return;
    }

    setLoading(true);

    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];

    if (currentGoal) {
      updateWeeklyGoal(currentGoal.id, {
        target_workouts: target,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Uspjeh', 'Cilj ažuriran!');
    } else {
      createWeeklyGoal({
        user_id: user.id,
        week_start: weekStart,
        target_workouts: target,
        completed_workouts: 0,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Uspjeh', 'Cilj kreiran!');
    }

    loadGoals();
    setLoading(false);
  };

  const getProgressPercentage = (goal: WeeklyGoal) => {
    return Math.min((goal.completed_workouts / goal.target_workouts) * 100, 100);
  };

  const formatWeekStart = (weekStart: string) => {
    const date = new Date(weekStart);
    return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sedmični ciljevi</Text>
        <Text style={styles.subtitle}>Postavi i prati svoje sedmične ciljeve</Text>
      </View>

      {currentGoal && (
        <Card style={styles.currentGoalCard}>
          <Text style={styles.cardTitle}>Trenutni cilj</Text>
          <View style={styles.goalStats}>
            <Text style={styles.goalCount}>
              {currentGoal.completed_workouts}/{currentGoal.target_workouts}
            </Text>
            <Text style={styles.goalLabel}>treninzi</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgressPercentage(currentGoal)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getProgressPercentage(currentGoal))}% kompletno
          </Text>
        </Card>
      )}

      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>
          {currentGoal ? 'Ažuriraj cilj' : 'Postavi novi cilj'}
        </Text>

        <Input
          label="Broj treninga tjedno"
          value={targetWorkouts}
          onChangeText={setTargetWorkouts}
          keyboardType="number-pad"
          placeholder="4"
        />

        <Input
          label="Bilješke (opcionalno)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Tvoj motivacioni tekst..."
          multiline
          numberOfLines={3}
        />

        <Button
          title={currentGoal ? 'Ažuriraj cilj' : 'Kreiraj cilj'}
          onPress={handleSaveGoal}
          loading={loading}
        />
      </Card>

      {pastGoals.length > 0 && (
        <View style={styles.pastGoalsSection}>
          <Text style={styles.sectionTitle}>Prošli ciljevi</Text>
          {pastGoals.map((goal) => (
            <Card key={goal.id} style={styles.pastGoalCard}>
              <Text style={styles.pastGoalDate}>
                Sedmica od {formatWeekStart(goal.week_start)}
              </Text>
              <View style={styles.pastGoalStats}>
                <Text style={styles.pastGoalCount}>
                  {goal.completed_workouts}/{goal.target_workouts} treninga
                </Text>
                <Text
                  style={[
                    styles.pastGoalStatus,
                    goal.completed_workouts >= goal.target_workouts
                      ? styles.goalCompleted
                      : styles.goalIncomplete,
                  ]}
                >
                  {goal.completed_workouts >= goal.target_workouts
                    ? '✓ Ispunjeno'
                    : '○ Nije ispunjeno'}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  currentGoalCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  goalStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  goalCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  goalLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  progressBar: {
    width: '100%',
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
  },
  formCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  pastGoalsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  pastGoalCard: {
    marginBottom: 12,
  },
  pastGoalDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  pastGoalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastGoalCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pastGoalStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalCompleted: {
    color: '#34C759',
  },
  goalIncomplete: {
    color: '#FF9500',
  },
});
