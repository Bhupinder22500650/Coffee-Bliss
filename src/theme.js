import { StyleSheet } from 'react-native';

export const colors = {
  background: '#201A18',
  surface: '#2B2320',
  card: '#3B302C',
  border: '#5A4943',
  text: '#F6F1EE',
  muted: '#DCCFC9',
  accent: '#C67C4E',
  onAccent: '#1B0F0A',
  danger: '#FFB4A2',
};

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  heading: { color: colors.text, fontSize: 18, fontWeight: '700' },
  text: { color: colors.text, fontSize: 16, lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 48,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
});
