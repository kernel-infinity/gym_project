import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/LocalAuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { updateUser } from '../../database/localServices';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = () => {
    if (!user) return;

    if (!name.trim() || !email.trim()) {
      Alert.alert('Greška', 'Molimo popunite sva polja');
      return;
    }

    setLoading(true);

    try {
      updateUser(user.id, {
        name: name.trim(),
        email: email.trim(),
      });

      Alert.alert('Uspjeh', 'Profil ažuriran!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Greška', 'Greška pri ažuriranju profila');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Odjava',
      'Da li si siguran da se želiš odjaviti?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Informacije o profilu</Text>

        <Input
          label="Ime"
          value={name}
          onChangeText={setName}
          placeholder="Tvoje ime"
        />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tvoj@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title="Ažuriraj profil"
          onPress={handleUpdateProfile}
          loading={loading}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Postavke jedinica</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Jedinica težine</Text>
          <Text style={styles.settingValue}>{user?.weight_unit || 'kg'}</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Jedinica visine</Text>
          <Text style={styles.settingValue}>{user?.height_unit || 'cm'}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>O aplikaciji</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Verzija</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tehnologija</Text>
          <Text style={styles.infoValue}>React Native + Expo</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Baza podataka</Text>
          <Text style={styles.infoValue}>SQLite (offline)</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Odjavi se"
          onPress={handleLogout}
          variant="danger"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>GymPal - Tvoj partner za trening 💪</Text>
        <Text style={styles.footerSubtext}>Razvijeno sa ❤️ za ljubitelje fitnessa</Text>
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
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  settingValue: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  infoValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actions: {
    padding: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
