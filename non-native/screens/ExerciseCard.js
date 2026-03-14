import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function parseDateValue(v) {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);

  const d1 = new Date(v);
  if (!isNaN(d1.getTime())) return d1;

  const d2 = new Date(`${v}T00:00:00`);
  if (!isNaN(d2.getTime())) return d2;

  const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));

  const m2 = String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));

  return new Date();
}



function formatDate(v) {
  const d = parseDateValue(v);
  try {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); // e.g. "Oct 20, 2025"
  } catch {
    return d.toDateString();
  }
}

function getWeekday(v) {
  const d = parseDateValue(v);
  try {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  } catch {
    return d.toLocaleString('en-US', { weekday: 'long' });
  }
}


function ExerciseCard({ item, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.title}>{item.name}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.muscle}</Text>
          </View>
        </View>

        <View style={styles.icons}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#333" /> 
          </TouchableOpacity>         
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#d9534f" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Sets</Text>
          <Text style={styles.metricValue}>{item.sets}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Reps</Text>
          <Text style={styles.metricValue}>{item.reps}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Weight</Text>
          <Text style={styles.metricValue}>{item.weight}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.footerLeftWrap}>
           <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#6b6b6b" />
           <Text style={styles.footerLeftText}>{getWeekday(item.date)}</Text>
         </View>
         <Text style={styles.footerDate}>{formatDate(item.date)}</Text>
       </View>
    </View>
  );
}

export default memo(ExerciseCard, (prev, next) => prev.item === next.item);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '450' },

  tag: {
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tagText: { color: '#c26b9b', fontSize: 12 },

  icons: { flexDirection: 'row' },
  iconBtn: { marginLeft: 8, padding: 6 },
  iconText: { fontSize: 16 },

  metricsRow: { flexDirection: 'row', marginTop: 16, marginBottom: 12, justifyContent: 'space-between' },
  metricBox: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#f7f9ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e9ff',
  },
  metricLabel: { color: '#8b8b8b', fontSize: 12 },
  metricValue: { fontWeight: '450', marginTop: 6 },

  cardFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
   footerLeftWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
   footerLeftText: { color: '#6b6b6b', marginLeft: 8, fontSize: 14 },
   footerDate: { color: '#6b6b6b' },
});