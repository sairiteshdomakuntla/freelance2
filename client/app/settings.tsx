import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [linkingPhone, setLinkingPhone] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [conflictAccount, setConflictAccount] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await api.request('/api/users/me');
      setUser(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPhone = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    try {
      setLinkingPhone(true);
      await api.request('/api/users/me/link-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });

      Alert.alert('Success', 'Phone number linked successfully');
      setPhoneNumber('');
      loadUserProfile();
    } catch (error: any) {
      if (error.status === 409) {
        // Conflict - phone already exists on another account
        setConflictAccount({
          type: 'phone',
          identifier: phoneNumber.trim(),
          existingAccountId: error.data?.existingAccountId,
        });
        Alert.alert(
          'Account Already Exists',
          'This phone number is already linked to another account. Would you like to merge the accounts?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Merge Accounts',
              onPress: () => handleMergeAccount(error.data?.existingAccountId),
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to link phone number');
      }
    } finally {
      setLinkingPhone(false);
    }
  };

  const handleLinkEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setLinkingEmail(true);
      await api.request('/api/users/me/link-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      Alert.alert('Success', 'Email linked successfully');
      setEmail('');
      loadUserProfile();
    } catch (error: any) {
      if (error.status === 409) {
        // Conflict - email already exists on another account
        setConflictAccount({
          type: 'email',
          identifier: email.trim(),
          existingAccountId: error.data?.existingAccountId,
        });
        Alert.alert(
          'Account Already Exists',
          'This email is already linked to another account. Would you like to merge the accounts?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Merge Accounts',
              onPress: () => handleMergeAccount(error.data?.existingAccountId),
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to link email');
      }
    } finally {
      setLinkingEmail(false);
    }
  };

  const handleMergeAccount = async (targetAccountId: string) => {
    try {
      setLoading(true);
      await api.request('/api/users/me/merge-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAccountId }),
      });

      Alert.alert(
        'Success',
        'Accounts merged successfully. Please log in again.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.removeItem('session_token');
              router.replace('/login');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to merge accounts');
    } finally {
      setLoading(false);
      setConflictAccount(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Call Better Auth signOut FIRST to clear server session
            await authClient.signOut();
            
            // Then clear AsyncStorage session
            await AsyncStorage.removeItem('session_token');
            await AsyncStorage.removeItem('user');
            
            console.log('✅ Logged out successfully');
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            // Still clear local storage and redirect even if signOut fails
            await AsyncStorage.removeItem('session_token');
            await AsyncStorage.removeItem('user');
            router.replace('/login');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Account Settings</Text>
      </View>

      {/* Current Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Account</Text>
        <View style={styles.infoCard}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || 'Not set'}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>
            {user?.email || 'Not linked'}
            {user?.emailVerified && ' ✓'}
          </Text>

          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>
            {user?.phoneNumber || 'Not linked'}
            {user?.phoneNumberVerified && ' ✓'}
          </Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user?.role || 'Not set'}</Text>
        </View>
      </View>

      {/* Link Phone Number */}
      {!user?.phoneNumber && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link Phone Number</Text>
          <Text style={styles.description}>
            Add a phone number to enable phone-based login
          </Text>
          <TextInput
            style={styles.input}
            placeholder="+1234567890"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, linkingPhone && styles.buttonDisabled]}
            onPress={handleLinkPhone}
            disabled={linkingPhone}
          >
            {linkingPhone ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Link Phone Number</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Link Email */}
      {!user?.email && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link Email</Text>
          <Text style={styles.description}>
            Add an email to enable Google login and receive notifications
          </Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, linkingEmail && styles.buttonDisabled]}
            onPress={handleLinkEmail}
            disabled={linkingEmail}
          >
            {linkingEmail ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Link Email</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 3,
  },
  value: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
