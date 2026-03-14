import React, { useCallback, useState, useMemo } from 'react';
import { Platform, View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExercises } from '../contexts/ExerciseContext';
import ExerciseCard from './ExerciseCard';
import FiltersBar from '../components/FilterBar';

export default function ListScreen({ navigation }) {
  const { exercises, removeExercise } = useExercises();

  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  const muscleOptions = useMemo(() => {
    const s = new Set(exercises.map(e => e.muscle).filter(Boolean));
    return Array.from(s).sort();
  }, [exercises]);

  const dayOptions = useMemo(() => {
    const s = new Set(exercises.map(e => e.day).filter(Boolean));
    return Array.from(s).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter(item => {
      if (selectedMuscle && item.muscle !== selectedMuscle) return false;
      if (selectedDay && item.day !== selectedDay) return false;
      return true;
    });
  }, [exercises, selectedMuscle, selectedDay]);

  const handleDelete = useCallback((id) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete Exercise — are you sure?')) {
        removeExercise(id);
      }
      return;
    }

    Alert.alert(
      'Delete Exercise',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeExercise(id) },
      ]
    );
  }, [removeExercise]);

  const handleEdit = useCallback((item) => {
    navigation.navigate('Edit', { id: item.id });
  }, [navigation]);

  const renderCard = ({ item }) => (
    <ExerciseCard item={item} onEdit={handleEdit} onDelete={handleDelete} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="dumbbell" size={28} color="#fff" style={styles.headerIcon} />
          <View>
            <Text style={styles.logo}>FitTrack</Text>
            <Text style={styles.subtitle}>Track your workouts, build your strength</Text>
          </View>
        </View>
      </LinearGradient>

      <FiltersBar
        muscleOptions={muscleOptions}
        dayOptions={dayOptions}
        selectedMuscle={selectedMuscle}
        setSelectedMuscle={setSelectedMuscle}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        style={{ marginVertical: 12 }}
      />

      <FlatList
        contentContainerStyle={{ paddingBottom: 120 }}
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        style={styles.list}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Add')}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: '100vh', backgroundColor: '#f6f6f8' },

  // header uses LinearGradient in JSX; keep layout-only styles here
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 92,
    justifyContent: 'center',
  },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerIcon: {
     marginRight: 12,
     marginTop: 6,       // small nudge to align icon with the title baseline
  },

  

  logo: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { color: '#e8e7ff', marginTop: 6 },

  list: { paddingHorizontal: 12, marginTop: 6 },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5B3DFC',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28 },

  /* styles used by the inlined FiltersBar originally — kept for compatibility with the external component */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
    justifyContent: 'space-between',
  },
  pill: {
    backgroundColor: '#efeef2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
  },
  pillText: { color: '#6b6b6b' },
});