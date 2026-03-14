import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExercises } from '../contexts/ExerciseContext';
import styles from './styles/AddScreen.styles';

export default function AddScreen({ navigation }) {
  const { addExercise } = useExercises();

  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [day, setDay] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [tempDate, setTempDate] = useState(date); // used for iOS modal until user presses Done

  // helper: remove non-digit chars so inputs accept integers only
  const sanitizeInt = (v) => String(v).replace(/\D+/g, '');

  // ensure first letter is capitalized on blur
  const handleNameBlur = () => {
    setName(prev => {
      if (!prev) return prev;
      const trimmed = prev.trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    });
  };

  const onSubmit = () => {
    const trimmedName = name.trim();

    // validation: name required and must start with capital letter
    if (!trimmedName || !/^[A-Z]/.test(trimmedName)) {
      alert('Name is required and must start with a capital letter.');
      Alert.alert('Invalid Name', 'Name is required and must start with a capital letter.');
      return;
    }

    // validate integer fields if provided
   if (!sets) {
       Alert.alert('Validation', 'Sets is required and must be an integer.');
       return;
     }
    if (!/^\d+$/.test(sets)) {
      Alert.alert('Validation', 'Sets must be an integer.');
      return;
    }

    if(sets == '0'){
      Alert.alert('Validation', 'Sets must be greater than zero.');
      return;
    }

    if (!reps) {
      Alert.alert('Validation', 'Reps is required and must be an integer.');
      return;
    }
    if (!/^\d+$/.test(reps)) {
      Alert.alert('Validation', 'Reps must be an integer.');
      return;
    }

    if(reps == '0'){
      Alert.alert('Validation', 'Reps must be greater than zero.');
      return;
    }

    if(weight == '0'){
      Alert.alert('Validation', 'Weight must be greater than zero.');
      return;
    }

    if (!weight) {
      Alert.alert('Validation', 'Weight is required and must be an integer (kg).');
      return;
    }
    if (!/^\d+$/.test(weight)) {
      Alert.alert('Validation', 'Weight must be an integer (kg).');
      return;
    }

    const newItem = {
      name: trimmedName,
      muscle: muscle.trim(),
      sets: Number.parseInt(sets, 10),
      reps: Number.parseInt(reps, 10),
      weight: `${Number.parseInt(weight, 10)} kg` ,
      day: day || 'Saturday',
      date: date.toDateString(),
    };
    addExercise(newItem);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>New Exercise</Text>
      </LinearGradient>

      <View style={styles.form}>
        <Label text="Exercise Name" />
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={handleNameBlur}
          autoCapitalize="words"
          placeholder="E.g. Bench Press"
          style={styles.input}
        />

        <Label text="Target Muscle" />
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={muscle}
            onValueChange={(v) => setMuscle(v)}
            style={styles.picker}
            mode="dropdown"
          >
            <Picker.Item label="Select Muscle Group" value="" />
            <Picker.Item label="Chest" value="Chest" />
            <Picker.Item label="Back" value="Back" />
            <Picker.Item label="Shoulders" value="Shoulders" />
            <Picker.Item label="Biceps" value="Biceps" />
            <Picker.Item label="Triceps" value="Triceps" />
            <Picker.Item label="Legs" value="Legs" />
          </Picker>
        </View>

        <View style={styles.row}>
          <View style={styles.smallCol}>
            <Label text="Sets" />
            <TextInput
              value={sets}
              onChangeText={(v) => setSets(sanitizeInt(v))}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={styles.smallCol}>
            <Label text="Reps" />
            <TextInput
              value={reps}
              onChangeText={(v) => setReps(sanitizeInt(v))}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={styles.smallCol}>
            <Label text="Weight (kg)" />
            <TextInput
              value={weight}
              onChangeText={(v) => setWeight(sanitizeInt(v))}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <Label text="Day of the week" />
        <View style={styles.pickerWrap}>
          <Picker selectedValue={day} onValueChange={setDay} style={styles.picker}>
            <Picker.Item label="Select day" value="" />
            <Picker.Item label="Monday" value="Monday" />
            <Picker.Item label="Tuesday" value="Tuesday" />
            <Picker.Item label="Wednesday" value="Wednesday" />
            <Picker.Item label="Thursday" value="Thursday" />
            <Picker.Item label="Friday" value="Friday" />
            <Picker.Item label="Saturday" value="Saturday" />
            <Picker.Item label="Sunday" value="Sunday" />
          </Picker>
        </View>

        <Label text="Date" />
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={date.toISOString().slice(0, 10)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setDate(new Date(v + 'T00:00:00'));
            }}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              backgroundColor: '#f2f2f4',
              border: 'none',
              marginBottom: 18,
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <>
            <TouchableOpacity
              style={styles.pill}
              onPress={() => {
                setTempDate(date); // initialize temp with current date
                setShowDate(true);
              }}
            >
              <Text style={styles.pillText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {/* Android: native dialog -> show when showDate true */}
            {Platform.OS === 'android' && showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                display="calendar"
                onChange={(event, selectedDate) => {
                  // on Android selectedDate is set once and the picker auto-closes
                  if (event?.type === 'dismissed') {
                    setShowDate(false);
                    return;
                  }
                  setDate(selectedDate || date);
                  setShowDate(false);
                }}
              />
            )}

            {/* iOS: show modal with spinner and explicit Done button so user sees selection */}
            {Platform.OS === 'ios' && (
              <Modal
                visible={showDate}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDate(false)}
              >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <View style={{ backgroundColor: '#fff', paddingBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                      <TouchableOpacity onPress={() => { setShowDate(false); }}>
                        <Text style={{ color: '#333', padding: 8 }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setDate(tempDate); setShowDate(false); }}>
                        <Text style={{ color: '#0066ff', padding: 8 }}>Done</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ borderTopColor: '#ddd', borderTopWidth: 1 }}>
                      {/* ensure enough height so spinner is visible */}
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        onChange={(event, selected) => {
                          // on iOS this fires continuously as the spinner moves
                          if (selected) setTempDate(selected);
                        }}
                        style={{ backgroundColor: '#fff', height: 216 }}
                        textColor="#000"
                      />
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={onSubmit} style={{ flex: 1 }}>
            <LinearGradient colors={['#6d28d9', '#4f46e5']} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtnWrap}>
            <View style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function Label({ text }) {
  return <Text style={{ marginBottom: 6, color: '#333', fontWeight: '600' }}>{text}</Text>;
}