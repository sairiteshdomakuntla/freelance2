import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authClient } from '../lib/authClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const result = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code: otp,
      });

      console.log('Verification result:', result);

      if (result.data) {
        // Store session token - our custom endpoint returns session and user objects
        const responseData = result.data as any;
        console.log('Response data:', responseData);
        
        if (responseData.session?.token) {
          await AsyncStorage.setItem('session_token', responseData.session.token);
          console.log('✅ Session token stored');
        }
        if (responseData.user) {
          await AsyncStorage.setItem('user', JSON.stringify(responseData.user));
          console.log('✅ User data stored');
        }
        
        // Verify storage
        const storedToken = await AsyncStorage.getItem('session_token');
        const storedUser = await AsyncStorage.getItem('user');
        console.log('Stored token:', storedToken);
        console.log('Stored user:', storedUser);
        
        Alert.alert('Success', 'Phone verified successfully!');
        router.replace('/home');
      } else {
        Alert.alert('Error', result.error?.message || 'Invalid OTP or verification failed');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      Alert.alert('Error', err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });
      Alert.alert('Success', 'OTP resent! Check your backend console.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={verifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={resendOtp}
            disabled={loading}
          >
            <Text style={styles.resendText}>Didn't receive code? Resend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backText}>Change phone number</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
  },
  phone: {
    fontWeight: '600',
    color: '#007AFF',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 24,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    padding: 12,
    alignItems: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  backText: {
    color: '#666',
    fontSize: 14,
  },
});
