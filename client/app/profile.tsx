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
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

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

  const handleAddEmail = async () => {
    if (!emailInput.trim() || !emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      const updated = await userAPI.addEmail(emailInput);
      setUser(updated);
      setEmailInput('');
      setShowEmailInput(false);
      Alert.alert('Success', 'Email added successfully to your account');
    } catch (error: any) {
      console.error('Failed to add email:', error);
      Alert.alert('Error', error.data?.message || error.message || 'Failed to add email');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhone = async () => {
    if (!phoneInput.trim() || !phoneInput.startsWith('+')) {
      Alert.alert('Error', 'Please enter a valid phone number with country code (e.g., +91)');
      return;
    }

    try {
      setSaving(true);
      const updated = await userAPI.addPhone(phoneInput);
      setUser(updated);
      setPhoneInput('');
      setShowPhoneInput(false);
      Alert.alert('Success', 'Phone number added successfully. Please verify it via OTP.');
    } catch (error: any) {
      console.error('Failed to add phone:', error);
      Alert.alert('Error', error.data?.message || error.message || 'Failed to add phone number');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call Better Auth signOut FIRST to clear server session
      await authClient.signOut();
      
      // Then clear AsyncStorage session
      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');
      
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
          {user.email ? (
            <TextInput
              style={[styles.input, styles.disabled]}
              value={user.email}
              editable={false}
            />
          ) : showEmailInput ? (
            <View>
              <TextInput
                style={styles.input}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.cancelButton]}
                  onPress={() => {
                    setShowEmailInput(false);
                    setEmailInput('');
                  }}
                  disabled={saving}
                >
                  <Text style={styles.smallButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.saveButton]}
                  onPress={handleAddEmail}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.smallButtonText}>Add Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowEmailInput(true)}
            >
              <Text style={styles.addButtonText}>+ Add Email Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {user.phoneNumber ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, styles.disabled]}
              value={user.phoneNumber}
              editable={false}
            />
          </View>
        ) : showPhoneInput ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneInput}
              onChangeText={setPhoneInput}
              placeholder="+91xxxxxxxxxx"
              keyboardType="phone-pad"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, styles.cancelButton]}
                onPress={() => {
                  setShowPhoneInput(false);
                  setPhoneInput('');
                }}
                disabled={saving}
              >
                <Text style={styles.smallButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, styles.saveButton]}
                onPress={handleAddPhone}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.smallButtonText}>Add Phone</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowPhoneInput(true)}
            >
              <Text style={styles.addButtonText}>+ Add Phone Number</Text>
            </TouchableOpacity>
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
  addButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  smallButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
