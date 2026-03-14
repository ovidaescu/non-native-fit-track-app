import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function FiltersBar({
  muscleOptions = [],
  dayOptions = [],
  selectedMuscle,
  setSelectedMuscle,
  selectedDay,
  setSelectedDay,
  style,
}) {
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [tempMuscle, setTempMuscle] = useState(selectedMuscle);
  const [tempDay, setTempDay] = useState(selectedDay);

  useEffect(() => setTempMuscle(selectedMuscle), [selectedMuscle]);
  useEffect(() => setTempDay(selectedDay), [selectedDay]);

  // Small helper used in iOS list modal
  function OptionRow({ label, value, onPress, selected }) {
    return (
      <TouchableOpacity
        onPress={() => onPress(value)}
        style={[styles.optionRow, selected && styles.optionRowSelected]}
      >
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // iOS: show a modal with a scroll list (wheel can be problematic in some setups)
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.row, style]}>
        <TouchableOpacity
          style={styles.touch}
          onPress={() => { setTempMuscle(selectedMuscle); setShowMuscleModal(true); }}
        >
          <Text style={styles.touchText}>{selectedMuscle || 'All Muscles'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.touch}
          onPress={() => { setTempDay(selectedDay); setShowDayModal(true); }}
        >
          <Text style={styles.touchText}>{selectedDay || 'All Days'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setSelectedMuscle(''); setSelectedDay(''); }}
          style={styles.resetBtn}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>

        <Modal visible={showMuscleModal} animationType="slide" transparent onRequestClose={() => setShowMuscleModal(false)}>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowMuscleModal(false)}><Text style={styles.modalAction}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setSelectedMuscle(tempMuscle); setShowMuscleModal(false); }}><Text style={styles.modalAction}>Done</Text></TouchableOpacity>
              </View>

              <View style={styles.listWrap}>
                <ScrollView>
                  <OptionRow
                    label="All Muscles"
                    value=""
                    onPress={(v) => setTempMuscle(v)}
                    selected={tempMuscle === ''}
                  />
                  {muscleOptions.map(m => (
                    <OptionRow key={m} label={m} value={m} onPress={(v) => setTempMuscle(v)} selected={tempMuscle === m} />
                  ))}
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        <Modal visible={showDayModal} animationType="slide" transparent onRequestClose={() => setShowDayModal(false)}>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDayModal(false)}><Text style={styles.modalAction}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setSelectedDay(tempDay); setShowDayModal(false); }}><Text style={styles.modalAction}>Done</Text></TouchableOpacity>
              </View>

              <View style={styles.listWrap}>
                <ScrollView>
                  <OptionRow
                    label="All Days"
                    value=""
                    onPress={(v) => setTempDay(v)}
                    selected={tempDay === ''}
                  />
                  {dayOptions.map(d => (
                    <OptionRow key={d} label={d} value={d} onPress={(v) => setTempDay(v)} selected={tempDay === d} />
                  ))}
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    );
  }

  // Android / web: normal inline Picker
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.control, Platform.OS === 'web' && styles.controlWeb]}>
        <Picker
          selectedValue={selectedMuscle}
          onValueChange={setSelectedMuscle}
          mode="dropdown"
          style={styles.picker}
        >
          <Picker.Item label="All Muscles" value="" />
          {muscleOptions.map(m => <Picker.Item key={m} label={m} value={m} />)}
        </Picker>
      </View>

      <View style={[styles.control, Platform.OS === 'web' && styles.controlWeb]}>
        <Picker
          selectedValue={selectedDay}
          onValueChange={setSelectedDay}
          mode="dropdown"
          style={styles.picker}
        >
          <Picker.Item label="All Days" value="" />
          {dayOptions.map(d => <Picker.Item key={d} label={d} value={d} />)}
        </Picker>
      </View>

      <TouchableOpacity onPress={() => { setSelectedMuscle(''); setSelectedDay(''); }} style={[styles.resetBtn, Platform.OS === 'web' && styles.resetBtnWeb]}>
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
  },
  control: {
    flex: 1,
    backgroundColor: '#f2f2f4',
    borderRadius: 10,
    height: 42,
    overflow: 'hidden',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
    marginHorizontal: 6,
  },
  controlWeb: { overflow: 'visible', zIndex: 50 },
  picker: { height: 42, width: '100%', color: '#333', backgroundColor: 'transparent', paddingHorizontal: 10 },
  resetBtn: { marginLeft: 8, paddingHorizontal: 12, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  resetBtnWeb: { zIndex: 50 },
  resetText: { color: '#333', fontSize: 13, fontWeight: '600' },

  // iOS touch look
  touch: { flex: 1, backgroundColor: '#f2f2f4', borderRadius: 10, height: 42, justifyContent: 'center', paddingHorizontal: 12, marginHorizontal: 6 },
  touchText: { color: '#333' },

  // modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingBottom: 12, maxHeight: 420 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  modalAction: { color: '#007aff', fontWeight: '600' },

  // list inside modal
  listWrap: { borderTopColor: '#e6e6e6', borderTopWidth: 1, backgroundColor: '#fff', maxHeight: 320 },
  optionRow: { paddingVertical: 14, paddingHorizontal: 18, borderBottomColor: '#f0f0f0', borderBottomWidth: 1 },
  optionRowSelected: { backgroundColor: '#eef2ff' },
  optionText: { fontSize: 16, color: '#222' },
  optionTextSelected: { color: '#1a56db', fontWeight: '700' },

  pickerItem: { fontSize: 16 },
});