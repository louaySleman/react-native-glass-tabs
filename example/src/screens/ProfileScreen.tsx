import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme, sharedStyles, CARD_COLORS } from '../utils/theme';

const ITEMS = ['Settings', 'Favorites', 'Downloads', 'History', 'Privacy', 'Notifications', 'Storage', 'Help', 'About', 'Invite', 'Theme', 'Logout'];

const ProfileScreen = () => {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={sharedStyles.content}
      contentInsetAdjustmentBehavior="automatic">
      {ITEMS.map((item, i) => (
        <View key={i} style={[sharedStyles.bigCard, { backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }]}>
          <Text style={sharedStyles.bigCardTitle}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default ProfileScreen;
