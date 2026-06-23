import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme, sharedStyles, CARD_COLORS } from '../utils/theme';

interface ChatScreenProps {
  badgeCount?: number;
  onIncrementBadge?: () => void;
  onDecrementBadge?: () => void;
  onResetBadge?: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  badgeCount = 0,
  onIncrementBadge,
  onDecrementBadge,
  onResetBadge,
}) => {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={sharedStyles.content}
      contentInsetAdjustmentBehavior="automatic">
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
          Badge: {badgeCount}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onDecrementBadge}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 0.5,
              borderColor: theme.colors.border,
            }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onIncrementBadge}
            style={{
              backgroundColor: '#007AFF',
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onResetBadge}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 0.5,
              borderColor: theme.colors.border,
            }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary }}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      {Array.from({ length: 20 }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>Contact {i + 1}</Text>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 }}>Latest message preview...</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default ChatScreen;
