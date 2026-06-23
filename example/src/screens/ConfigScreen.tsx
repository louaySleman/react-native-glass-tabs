import React from 'react';
import { View, Text, ScrollView, StatusBar, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../utils/theme';

const THEME_COLORS = [
  { label: 'Blue', value: '#007AFF' },
  { label: 'Red', value: '#FF3B30' },
  { label: 'Green', value: '#34C759' },
  { label: 'Purple', value: '#AF52DE' },
  { label: 'Orange', value: '#FF9500' },
  { label: 'Pink', value: '#FF2D55' },
  { label: 'Teal', value: '#5AC8FA' },
];

export interface AppConfig {
  primaryColor: string;
  floating: boolean;
  labeled: boolean;
  hapticFeedback: boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  primaryColor: '#007AFF',
  floating: true,
  labeled: true,
  hapticFeedback: true,
};

// ─── Sub-components ───

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
  const theme = useTheme();
  return (
    <View style={s.sectionHeader}>
      <Text style={[s.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    </View>
  );
};

const ToggleRow: React.FC<{
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  badge?: string;
}> = ({ label, value, onToggle, badge }) => {
  const theme = useTheme();
  return (
    <View style={[s.row, { borderBottomColor: theme.colors.border }]}>
      <View style={s.rowLeft}>
        <Text style={[s.rowLabel, { color: theme.colors.text }]}>{label}</Text>
        {badge && (
          <View style={[s.badge, badge === 'Android' ? s.badgeAndroid : s.badgeIos]}>
            <Text style={s.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
};

const ColorPickerRow: React.FC<{
  label: string;
  selected: string;
  onSelect: (c: string) => void;
}> = ({ label, selected, onSelect }) => {
  const theme = useTheme();
  return (
    <View style={[s.colorRow, { borderBottomColor: theme.colors.border }]}>
      <Text style={[s.rowLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={s.colorPicker}>
        {THEME_COLORS.map(c => (
          <TouchableOpacity
            key={c.value}
            onPress={() => onSelect(c.value)}
            style={[
              s.colorDot,
              { backgroundColor: c.value },
              selected === c.value && [s.colorDotSelected, { borderColor: theme.colors.text }],
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Main ───

const ConfigScreen: React.FC<{
  config: AppConfig;
  onUpdate: (patch: Partial<AppConfig>) => void;
}> = ({ config, onUpdate }) => {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={[s.content, { paddingBottom: 140 }]}
      contentInsetAdjustmentBehavior="automatic">
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <SectionHeader title="Colors" />
      <View style={[s.card, { backgroundColor: theme.colors.card }]}>
        <ColorPickerRow
          label="Primary Color"
          selected={config.primaryColor}
          onSelect={v => onUpdate({ primaryColor: v })}
        />
      </View>

      <SectionHeader title="Layout" />
      <View style={[s.card, { backgroundColor: theme.colors.card }]}>
        <ToggleRow label="Floating" value={config.floating} onToggle={v => onUpdate({ floating: v })} badge="Android" />
        <ToggleRow label="Labeled" value={config.labeled} onToggle={v => onUpdate({ labeled: v })} />
        <ToggleRow label="Haptic Feedback" value={config.hapticFeedback} onToggle={v => onUpdate({ hapticFeedback: v })} badge="iOS" />
      </View>

      <View style={s.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={theme.colors.textSecondary} />
        <Text style={[s.infoText, { color: theme.colors.textSecondary }]}>
          Changes apply in real-time. Switch tabs to see the effect.
        </Text>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  content: { padding: 16 },
  sectionHeader: { marginTop: 24, marginBottom: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 16 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeAndroid: { backgroundColor: '#E8F5E9' },
  badgeIos: { backgroundColor: '#E3F2FD' },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#666' },
  colorRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  colorPicker: { flexDirection: 'row', gap: 10, marginTop: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 4 },
  infoText: { fontSize: 13, flex: 1 },
});

export default ConfigScreen;
