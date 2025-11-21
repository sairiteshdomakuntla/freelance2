import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { itemsAPI } from '../services/api';
import { Item } from '../types/item';

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    checkSession();
    fetchItems();
  }, []);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (!token || !userStr) {
        router.replace('/login');
      } else {
        const user = JSON.parse(userStr);
        setSession({ user });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      router.replace('/login');
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await itemsAPI.getAll();
      setItems(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      await itemsAPI.create({ name, description });
      setName('');
      setDescription('');
      fetchItems();
      Alert.alert('Success', 'Item created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await itemsAPI.delete(id);
      fetchItems();
      Alert.alert('Success', 'Item deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete item');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user');
      router.replace('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout even if error
      router.replace('/login');
    }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        <Text style={styles.itemDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item._id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Items Manager</Text>
          {session?.user && (
            <Text style={styles.userInfo}>
              {session.user.phoneNumber || session.user.email}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Item name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items yet. Create one!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
});
