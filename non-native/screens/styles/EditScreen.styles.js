import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  header: {
    height: 140,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  input: {
    borderWidth: 0,
    backgroundColor: '#f2f2f4',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  pickerWrap: {
    backgroundColor: '#f2f2f4',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  pill: {
    backgroundColor: '#f2f2f4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  pillText: { color: '#333' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  smallCol: { flex: 1, marginHorizontal: 6 },
  buttonsRow: { flexDirection: 'row', marginTop: 10 },
  addBtn: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtnWrap: { width: 110 },
  cancelBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { color: '#fff', fontWeight: '700' },
});