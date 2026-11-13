import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView, LiquidGlassView } from 'react-native-glass-tabs';
import { useTheme } from '../utils/theme';
import { PEOPLE, PLACES, unsplash } from '../utils/photos';

const DAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];
const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];
const today = () => {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** Photo feed: big, colourful cards scrolling under the tab bar. */
const HomeScreen = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardW = width - 32;
  // Android fades glass content between dark and light by itself. iOS doesn't, so pick it here:
  // the frosted chip follows the theme, the liquid chips sit over the darker bottom of the photo.
  const ios = Platform.OS === 'ios';
  const chipInk = ios ? theme.colors.text : DARK_INK;
  const photoInk = ios ? '#FFFFFF' : DARK_INK;
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[s.kicker, { color: theme.colors.textSecondary }]}>
        {today()}
      </Text>
      <Text style={[s.title, { color: theme.colors.text }]}>Discover</Text>
      {PLACES.map((p, i) => {
        const author = PEOPLE[i % PEOPLE.length]!;
        return (
          <View
            key={p.id}
            style={[s.card, { width: cardW, height: cardW * 1.2 }]}
          >
            <Image
              source={{ uri: unsplash(p.id, cardW * 2) }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.shade} />
            {/* Glass chips: on Android their dark text turns white by itself over dark photos. */}
            <View style={s.cardTop}>
              <BlurView style={s.authorChip}>
                <Image
                  source={{ uri: unsplash(author.id, 96) }}
                  style={s.avatar}
                />
                <Text style={[s.author, { color: chipInk }]}>
                  {author.name}
                </Text>
              </BlurView>
            </View>
            <View style={s.cardBottom}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{p.title}</Text>
                <LiquidGlassView style={s.placeChip}>
                  <Ionicons name="location-sharp" size={14} color={photoInk} />
                  <Text style={[s.place, { color: photoInk }]}>{p.place}</Text>
                </LiquidGlassView>
              </View>
              <LiquidGlassView style={s.like}>
                <Ionicons
                  name={i % 3 === 0 ? 'heart' : 'heart-outline'}
                  size={20}
                  color={photoInk}
                />
              </LiquidGlassView>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const DARK_INK = '#1C1C1E';

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 130 },
  kicker: { fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#C7C7CC',
    justifyContent: 'space-between',
  },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.18)' },
  cardTop: { flexDirection: 'row', padding: 14 },
  authorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 22,
    paddingLeft: 5,
    paddingRight: 14,
    height: 42,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  author: { color: '#1C1C1E', fontSize: 14, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', padding: 18 },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 8,
    borderRadius: 16,
    height: 32,
    paddingHorizontal: 12,
  },
  place: { color: '#1C1C1E', fontSize: 14, fontWeight: '600' },
  like: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
