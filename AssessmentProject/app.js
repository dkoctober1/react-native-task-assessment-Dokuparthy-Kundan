// Paste this into App.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPosts } from './src/services/api';
import PostCard from './src/components/PostCard';

const STORAGE_KEY = 'SEARCH_HISTORY';

const App = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch Posts Logic
  const loadPosts = async () => {
    try {
      setError(null);
      const data = await fetchPosts();
      setPosts(data);
      return data;
    } catch (err) {
      setError('Unable to fetch posts. Check your network connection.');
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. Load Saved Search on App Start
  useEffect(() => {
    const initializeApp = async () => {
      const allPosts = await loadPosts();
      
      // Get saved search text from storage
      const savedSearch = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSearch) {
        setSearch(savedSearch);
        handleFilter(savedSearch, allPosts); 
      } else {
        setFilteredPosts(allPosts);
      }
    };
    initializeApp();
  }, []);

  // 3. Search Filter Logic
  const handleFilter = (text, sourcePosts = posts) => {
    if (!text) {
      setFilteredPosts(sourcePosts);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = sourcePosts.filter((item) =>
        item.title.toLowerCase().includes(lowerText)
      );
      setFilteredPosts(filtered);
    }
  };

  const handleSearchChange = async (text) => {
    setSearch(text);
    handleFilter(text);
    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, text);
  };

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts().then((data) => handleFilter(search, data));
  }, [search]);

  // Loading Screen
  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by title..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {/* Main Content */}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostCard title={item.title} body={item.body} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No posts found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  list: {
    padding: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default App;