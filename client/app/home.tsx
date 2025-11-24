import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authClient } from '../lib/authClient';
import { userAPI } from '../services/api';
import type { User } from '../types/user';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await authClient.getSession();
      
      if (!session) {
        console.log('No session found, redirecting to login');
        router.replace('/login');
        return;
      }

      console.log('Session found, fetching profile...');

      // Fetch user profile
      try {
        const profile = await userAPI.getProfile();
        console.log('Profile fetched:', profile.email, 'Role:', profile.role);
        setUser(profile);
        
        // If user hasn't selected a role yet, redirect to role selection
        // Only redirect if role is not set at all (undefined or null)
        if (!profile.role) {
          console.log('No role set, redirecting to role selection');
          router.replace('/select-role');
          return;
        }
      } catch (profileError: any) {
        console.error('Profile fetch failed:', profileError);
        // If profile fetch fails, user might not be properly authenticated
        Alert.alert(
          'Authentication Error',
          'Unable to fetch your profile. Please log in again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }
    } catch (error) {
      console.error('Session check failed:', error);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.replace('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToAdmin = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Event Management</Text>
          <Text style={styles.userInfo}>
            Welcome, {user.name}!
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={navigateToProfile}>
            <Text style={styles.actionEmoji}>👤</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Profile</Text>
              <Text style={styles.actionDescription}>
                View and edit your profile information
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/settings')}>
            <Text style={styles.actionEmoji}>⚙️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Account Settings</Text>
              <Text style={styles.actionDescription}>
                Manage account, link email/phone, security
              </Text>
            </View>
          </TouchableOpacity>

          {user.role === 'Admin' && (
            <TouchableOpacity style={styles.actionCard} onPress={navigateToAdmin}>
              <Text style={styles.actionEmoji}>🛡️</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Admin Dashboard</Text>
                <Text style={styles.actionDescription}>
                  Manage users and system settings
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {user.role === 'Vendor' && (
            <>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionEmoji}>📅</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>My Events</Text>
                  <Text style={styles.actionDescription}>
                    Manage your upcoming events
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionEmoji}>💼</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Services</Text>
                  <Text style={styles.actionDescription}>
                    Manage your service offerings
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {user.role === 'Customer' && (
            <>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionEmoji}>🔍</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Browse Events</Text>
                  <Text style={styles.actionDescription}>
                    Discover and book events
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionEmoji}>📋</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>My Bookings</Text>
                  <Text style={styles.actionDescription}>
                    View your event bookings
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Account Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Account Status:</Text>
              <View style={[styles.statusBadge, user.isActive ? styles.activeStatus : styles.inactiveStatus]}>
                <Text style={styles.statusText}>
                  {user.isActive ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Email Verified:</Text>
              <Text style={styles.statusValue}>
                {user.emailVerified ? '✓ Yes' : '✗ No'}
              </Text>
            </View>
            {user.phoneNumber && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Phone Verified:</Text>
                <Text style={styles.statusValue}>
                  {user.phoneNumberVerified ? '✓ Yes' : '✗ No'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#34C759',
  },
  inactiveStatus: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
