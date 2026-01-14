import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/LocalAuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getAllBodyMetrics, createBodyMetric, deleteBodyMetric } from '../../database/localServices';
import { BodyMetric } from '../../types';

export const BodyMetricsScreen: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = () => {
    if (!user) return;
    const allMetrics = getAllBodyMetrics(user.id);
    setMetrics(allMetrics);
  };

  const handleAddMetric = () => {
    if (!user) return;

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      Alert.alert('Greška', 'Molimo unesite validnu težinu');
      return;
    }

    const bodyFatValue = bodyFat ? parseFloat(bodyFat) : undefined;
    if (bodyFat && (isNaN(bodyFatValue!) || bodyFatValue! < 0 || bodyFatValue! > 100)) {
      Alert.alert('Greška', 'Molimo unesite validan procenat masti (0-100)');
      return;
    }

    setLoading(true);

    createBodyMetric({
      user_id: user.id,
      recorded_at: new Date().toISOString(),
      weight: weightValue,
      body_fat_percentage: bodyFatValue,
      notes: notes.trim() || undefined,
    });

    Alert.alert('Uspjeh', 'Metrika dodana!');
    setWeight('');
    setBodyFat('');
    setNotes('');
    loadMetrics();
    setLoading(false);
  };

  const handleDeleteMetric = (id: number) => {
    Alert.alert(
      'Obriši metriku',
      'Da li si siguran da želiš obrisati ovu metriku?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: () => {
            deleteBodyMetric(id);
            loadMetrics();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWeightChange = () => {
    if (metrics.length < 2) return null;
    const latest = metrics[0].weight;
    const previous = metrics[1].weight;
    const change = latest - previous;
    return change;
  };

  const weightChange = getWeightChange();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tjelesne metrike</Text>
        <Text style={styles.subtitle}>Prati svoj napredak</Text>
      </View>

      {metrics.length > 0 && (
        <Card style={styles.latestCard}>
          <Text style={styles.cardTitle}>Najnovije mjerenje</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics[0].weight} kg</Text>
              <Text style={styles.metricLabel}>Težina</Text>
              {weightChange !== null && (
                <Text
                  style={[
                    styles.changeText,
                    weightChange > 0 ? styles.changePositive : styles.changeNegative,
                  ]}
                >
                  {weightChange > 0 ? '+' : ''}
                  {weightChange.toFixed(1)} kg
                </Text>
              )}
            </View>
            {metrics[0].body_fat_percentage && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics[0].body_fat_percentage}%</Text>
                <Text style={styles.metricLabel}>Tjelesna mast</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Dodaj novo mjerenje</Text>

        <Input
          label="Težina (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="75.5"
        />

        <Input
          label="Postotak tjelesne masti (opcionalno)"
          value={bodyFat}
          onChangeText={setBodyFat}
          keyboardType="decimal-pad"
          placeholder="15.0"
        />

        <Input
          label="Bilješke (opcionalno)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Dodatne informacije..."
          multiline
          numberOfLines={2}
        />

        <Button
          title="Dodaj mjerenje"
          onPress={handleAddMetric}
          loading={loading}
        />
      </Card>

      {metrics.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historija mjerenja</Text>
          {metrics.map((metric) => (
            <Card key={metric.id} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricDate}>{formatDate(metric.recorded_at)}</Text>
                  <View style={styles.metricValues}>
                    <Text style={styles.metricText}>
                      Težina: {metric.weight} kg
                    </Text>
                    {metric.body_fat_percentage && (
                      <Text style={styles.metricText}>
                        Mast: {metric.body_fat_percentage}%
                      </Text>
                    )}
                  </View>
                  {metric.notes && (
                    <Text style={styles.metricNotes}>{metric.notes}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteMetric(metric.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
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
  latestCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changePositive: {
    color: '#FF9500',
  },
  changeNegative: {
    color: '#34C759',
  },
  formCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  historySection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  metricCard: {
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricInfo: {
    flex: 1,
  },
  metricDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  metricValues: {
    marginBottom: 4,
  },
  metricText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  metricNotes: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});
