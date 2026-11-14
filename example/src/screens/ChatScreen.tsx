import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../utils/theme';
import { PEOPLE, unsplash } from '../utils/photos';

interface ChatScreenProps {
  badgeCount?: number;
  onIncrementBadge?: () => void;
  onDecrementBadge?: () => void;
  onResetBadge?: () => void;
}

/** Conversations with real avatars, plus controls for the tab badge. */
const ChatScreen: React.FC<ChatScreenProps> = ({
  badgeCount = 0,
  onIncrementBadge,
  onDecrementBadge,
  onResetBadge,
}) => {
  const theme = useTheme();
  const people = [...PEOPLE, ...PEOPLE.slice().reverse()];
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={s.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[s.badgeBar, { backgroundColor: theme.colors.card }]}>
        <Text style={[s.badgeLabel, { color: theme.colors.text }]}>
          Tab badge: {badgeCount}
        </Text>
        <View style={s.badgeButtons}>
          <TouchableOpacity
            onPress={onDecrementBadge}
            style={[s.btn, { backgroundColor: theme.colors.background }]}
          >
            <Text style={[s.btnText, { color: theme.colors.text }]}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onIncrementBadge}
            style={[s.btn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[s.btnText, s.white]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onResetBadge}
            style={[s.btn, { backgroundColor: theme.colors.background }]}
          >
            <Text style={[s.reset, { color: theme.colors.textSecondary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {people.map((p, i) => (
        <View
          key={`${p.id}-${i}`}
          style={[s.row, { borderBottomColor: theme.colors.border }]}
        >
          <View>
            <Image source={{ uri: unsplash(p.id, 120) }} style={s.avatar} />
            {i % 3 === 0 ? (
              <View
                style={[s.online, { borderColor: theme.colors.background }]}
              />
            ) : null}
          </View>
          <View style={s.body}>
            <View style={s.top}>
              <Text style={[s.name, { color: theme.colors.text }]}>
                {p.name}
              </Text>
              <Text style={[s.time, { color: theme.colors.textSecondary }]}>
                {p.time}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[s.message, { color: theme.colors.textSecondary }]}
            >
              {p.message}
            </Text>
          </View>
          {i < 3 ? (
            <View style={[s.unread, { backgroundColor: theme.colors.primary }]}>
              <Text style={s.unreadText}>{3 - i}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 130 },
  badgeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  badgeLabel: { fontSize: 15, fontWeight: '600' },
  badgeButtons: { flexDirection: 'row', gap: 8 },
  btn: {
    minWidth: 40,
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 18, fontWeight: '700' },
  white: { color: '#FFFFFF' },
  reset: { fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#C7C7CC',
  },
  online: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2.5,
  },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 13 },
  message: { fontSize: 14, marginTop: 3 },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});

export default ChatScreen;
