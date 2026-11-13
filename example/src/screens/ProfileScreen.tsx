import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '../utils/theme';
import { PEOPLE, PLACES, unsplash } from '../utils/photos';

const STATS = [
  ['248', 'Photos'],
  ['12.4k', 'Followers'],
  ['318', 'Following'],
];

/** Profile: cover photo, avatar, stats and a photo grid. */
const ProfileScreen = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const me = PEOPLE[0]!;
  const cell = (width - 32 - 8) / 3;
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={s.content}
    >
      <Image
        source={{ uri: unsplash(PLACES[14]!.id, width * 2) }}
        style={[s.cover, { width }]}
      />
      <View style={s.head}>
        <Image
          source={{ uri: unsplash(me.id, 240) }}
          style={[s.avatar, { borderColor: theme.colors.background }]}
        />
        <Text style={[s.name, { color: theme.colors.text }]}>{me.name}</Text>
        <Text style={[s.bio, { color: theme.colors.textSecondary }]}>
          Landscape photographer · chasing light 🌄
        </Text>
        <View style={s.stats}>
          {STATS.map(([n, l]) => (
            <View key={l} style={s.stat}>
              <Text style={[s.statN, { color: theme.colors.text }]}>{n}</Text>
              <Text style={[s.statL, { color: theme.colors.textSecondary }]}>
                {l}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.grid}>
        {[...PLACES, ...PLACES.slice(0, 5)].map((p, i) => (
          <Image
            key={`${p.id}-${i}`}
            source={{ uri: unsplash(p.id, cell * 2) }}
            style={[s.cell, { width: cell, height: cell }]}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  content: { paddingBottom: 130 },
  cover: { height: 230, backgroundColor: '#C7C7CC' },
  head: { alignItems: 'center', marginTop: -52, paddingHorizontal: 24 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    backgroundColor: '#C7C7CC',
  },
  name: { fontSize: 24, fontWeight: '800', marginTop: 10 },
  bio: { fontSize: 15, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 36, marginTop: 18, marginBottom: 20 },
  stat: { alignItems: 'center' },
  statN: { fontSize: 19, fontWeight: '800' },
  statL: { fontSize: 13, marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 16,
  },
  cell: { borderRadius: 10, backgroundColor: '#C7C7CC' },
});

export default ProfileScreen;
