import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../utils/theme';
import { PLACES, unsplash } from '../utils/photos';

const TAGS = ['Mountains', 'Lakes', 'Forests', 'Coast', 'Night', 'Desert'];

/** Search: a field, topic chips and a two-column photo grid. */
const SearchScreen = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const colW = (width - 32 - 12) / 2;
  const photos = [...PLACES, ...PLACES.slice().reverse()];
  const cols = [
    photos.filter((_, i) => i % 2 === 0),
    photos.filter((_, i) => i % 2 === 1),
  ];
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={s.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[s.field, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
        <Text style={[s.placeholder, { color: theme.colors.textSecondary }]}>
          Places, people, moods
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tags}
      >
        {TAGS.map((t, i) => (
          <View
            key={t}
            style={[
              s.tag,
              {
                backgroundColor:
                  i === 0 ? theme.colors.primary : theme.colors.card,
              },
            ]}
          >
            <Text
              style={[
                s.tagText,
                { color: i === 0 ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              {t}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={s.grid}>
        {cols.map((col, c) => (
          <View key={c} style={[s.col, { width: colW }]}>
            {col.map((p, i) => (
              <View
                key={`${p.id}-${i}`}
                style={[
                  s.tile,
                  { height: colW * ((i + c) % 3 === 0 ? 1.45 : 1.05) },
                ]}
              >
                <Image
                  source={{ uri: unsplash(p.id, colW * 2) }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={s.tileText}>{p.title}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 130 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  placeholder: { fontSize: 16 },
  tags: { gap: 8, paddingVertical: 14 },
  tag: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  tagText: { fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', gap: 12 },
  col: { gap: 12 },
  tile: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#C7C7CC',
    justifyContent: 'flex-end',
  },
  tileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    padding: 12,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
  },
});

export default SearchScreen;
