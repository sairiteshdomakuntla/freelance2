import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userAPI } from '../services/api';

export default function SelectRoleScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Customer' | 'Vendor' | null>(null);

  const handleSelectRole = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    try {
      setLoading(true);
      await userAPI.setRole(selectedRole);
      Alert.alert('Success', 'Role set successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/home'),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to set role:', error);
      Alert.alert('Error', error.message || 'Failed to set role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select how you want to use our event management platform
        </Text>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'Customer' && styles.roleCardSelected,
          ]}
          onPress={() => setSelectedRole('Customer')}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleEmoji}>👤</Text>
          </View>
          <Text style={styles.roleTitle}>Customer</Text>
          <Text style={styles.roleDescription}>
            Browse and book events, manage your bookings, and connect with vendors
          </Text>
          {selectedRole === 'Customer' && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'Vendor' && styles.roleCardSelected,
          ]}
          onPress={() => setSelectedRole('Vendor')}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleEmoji}>🏢</Text>
          </View>
          <Text style={styles.roleTitle}>Vendor</Text>
          <Text style={styles.roleDescription}>
            Offer your services, manage events, and grow your business
          </Text>
          {selectedRole === 'Vendor' && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!selectedRole || loading) && styles.buttonDisabled]}
          onPress={handleSelectRole}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  roleIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  roleEmoji: {
    fontSize: 48,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
