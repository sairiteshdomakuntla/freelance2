import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient } from '../lib/authClient';
import { userAPI } from '../services/api';
import type { User, UpdateProfileData } from '../types/user';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UpdateProfileData>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const session = await authClient.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }

      const profile = await userAPI.getProfile();
      setUser(profile);
      setFormData({
        name: profile.name,
        bio: profile.bio || '',
        address: profile.address || {},
        businessName: profile.businessName || '',
        businessDescription: profile.businessDescription || '',
        serviceCategory: profile.serviceCategory,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await userAPI.updateProfile(formData);
      setUser(updated);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear AsyncStorage session
      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');
      
      // Call Better Auth signOut
      await authClient.signOut();
      
      console.log('✅ Logged out successfully');
      router.replace('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local storage and redirect even if signOut fails
      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>No user data</Text>
      </View>
    );
  }

  const isVendor = user.role === 'Vendor';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {user.image && (
          <Image source={{ uri: user.image }} style={styles.avatar} />
        )}
        <Text style={styles.title}>My Profile</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Your name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabled]}
            value={user.email}
            editable={false}
          />
        </View>

        {user.phoneNumber && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, styles.disabled]}
              value={user.phoneNumber}
              editable={false}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
          />
        </View>

        {isVendor && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={formData.businessName}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessName: text })
                }
                placeholder="Your business name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.businessDescription}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessDescription: text })
                }
                placeholder="Describe your services"
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.address?.city}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                address: { ...formData.address, city: text },
              })
            }
            placeholder="City"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={formData.address?.state}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                address: { ...formData.address, state: text },
              })
            }
            placeholder="State"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
});
