import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme, sharedStyles, CARD_COLORS } from '../utils/theme';

const SearchScreen = () => {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={sharedStyles.content}
      contentInsetAdjustmentBehavior="automatic">
      {Array.from({ length: 10 }).map((_, i) => (
        <View
          key={i}
          style={[sharedStyles.bigCard, { backgroundColor: CARD_COLORS[(i + 3) % CARD_COLORS.length], height: 100 }]}>
          <Text style={sharedStyles.bigCardTitle}>Result {i + 1}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default SearchScreen;
