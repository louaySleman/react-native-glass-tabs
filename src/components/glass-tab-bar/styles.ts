import { StyleSheet } from 'react-native';
import { DEFAULTS } from '../../config/defaults';

export const ICON_SIZE = DEFAULTS.ICON_SIZE;

export const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DEFAULTS.FADE_HEIGHT,
  },
  barWrapper: {
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    height: DEFAULTS.TAB_BAR_HEIGHT,
    width: '100%',
    alignItems: 'center',
  },
  nativeGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingVertical: 6,
    zIndex: 1,
  },
  selector: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: DEFAULTS.BADGE_RADIUS,
    minWidth: DEFAULTS.BADGE_MIN_WIDTH,
    height: DEFAULTS.BADGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: DEFAULTS.BADGE_TEXT_SIZE,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: DEFAULTS.LABEL_FONT_SIZE,
    fontWeight: '400',
    marginTop: 3,
  },
  labelFocused: {
    fontWeight: '500',
  },
});

export const iconStyles = StyleSheet.create({
  container: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
