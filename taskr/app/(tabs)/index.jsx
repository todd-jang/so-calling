import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, Keyboard, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../constants/api';

export default function TodoApp() {
  const { socket, user, token } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('init_data', (data) => {
      setTodos(data.todos);
      fetchPredictions(data.todos);
      setLoading(false);
    });

    socket.on('todo_added', (todo) => {
      setTodos(prev => [todo, ...prev]);
    });

    return () => {
      socket.off('init_data');
      socket.off('todo_added');
    };
  }, [socket]);

  const fetchPredictions = async (todoList) => {
    const preds = {};
    for (const item of todoList) {
      // Note: In taskr, we assume todos might have price history if they are flight alerts
      try {
        const res = await fetch(`${API_URL}/api/alerts/${item.id}/prediction`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) preds[item.id] = json.data;
      } catch (e) {
        // Silent fail for non-alert items
      }
    }
    setPredictions(preds);
  };

  const addTodo = useCallback(() => {
    if (!inputText.trim() || !socket) return;
    socket.emit('add_todo', { text: inputText.trim(), user });
    setInputText('');
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [inputText, socket, user]);

  const renderItem = ({ item }) => {
    const pred = predictions[item.id];
    return (
      <View style={styles.todoItem}>
        <View style={styles.itemHeader}>
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{item.category}</Text>
          </View>
          {pred && (
            <View style={[styles.trendBadge, pred.trend === 'DOWN' ? styles.down : styles.up]}>
              <Text style={styles.trendText}>
                {pred.trend === 'UP' ? '📈 상승' : pred.trend === 'DOWN' ? '📉 하락' : '➡️ 안정'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.todoBody}>
          <Text style={styles.todoText}>{item.text}</Text>
          {pred && (
            <View style={styles.predictionBox}>
              <Text style={styles.predictionText}>AI 가이드: {pred.recommendation}</Text>
              <Text style={styles.nextPrice}>예상가: {pred.nextPrice.toLocaleString()}원</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#38bdf8" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>AI Predictions</Text>
          <Text style={styles.subTitle}>ML Forecasting Active</Text>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Add flight alert or task..."
              placeholderTextColor="#94a3b8"
              onSubmitEditing={addTodo}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
              <Ionicons name="add" size={30} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={todos}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { padding: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: '#f8fafc' },
  subTitle: { fontSize: 12, color: '#38bdf8', fontWeight: 'bold' },
  inputSection: { padding: 16 },
  inputRow: { flexDirection: 'row', gap: 8 },
  textInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  addBtn: { width: 50, height: 50, backgroundColor: '#38bdf8', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  todoItem: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  catBadge: { backgroundColor: '#38bdf8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catText: { color: '#0f172a', fontWeight: 'bold', fontSize: 10 },
  trendBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  up: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  down: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  trendText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  todoBody: { gap: 10 },
  todoText: { fontSize: 18, color: '#f8fafc', fontWeight: '500' },
  predictionBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10 },
  predictionText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 4 },
  nextPrice: { color: '#38bdf8', fontWeight: 'bold', fontSize: 14 }
});
