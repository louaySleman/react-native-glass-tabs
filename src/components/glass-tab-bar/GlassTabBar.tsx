import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  Text,
  requireNativeComponent,
  type LayoutChangeEvent,
  Easing,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { TabConfig } from '../../types/glassTabs';
import { DEFAULTS } from '../../config/defaults';
import AnimatedTabIcon from './AnimatedTabIcon';
import { styles } from './styles';

/** Native glass background — wraps Dimezis/BlurView in Kotlin. */
const GlassBarNativeView = requireNativeComponent<{
  glassConfig: {
    cornerRadius: number;
    opacity: number;
    blurRadius: number;
    backgroundColor: string;
    darkMode: boolean;
  };
  style: any;
}>('GlassBarNativeView');

/** Native smooth fade gradient — Kotlin LinearGradient shader. */
const GlassFadeNativeView = requireNativeComponent<{
  fadeConfig: { backgroundColor: string; darkMode: boolean };
  style: any;
}>('GlassFadeNativeView');

interface GlassTabBarProps extends BottomTabBarProps {
  tabs: TabConfig[];
  primaryColor: string;
  inactiveColor: string;
  backgroundColor: string;
  opacity: number;
  cornerRadius: number;
  floating: boolean;
  floatingMargin: number;
  labeled: boolean;
  blurRadius: number;
  isDark: boolean;
}

/**
 * Android frosted glass tab bar.
 *
 * - Native GlassBarView (Dimezis/BlurView) for real hardware-accelerated blur
 * - Native GlassFadeView for smooth LinearGradient fade
 * - Animated selector that scales from center (Telegram-style)
 * - Icon crossfade between outline and filled states
 */
const GlassTabBar: React.FC<GlassTabBarProps> = ({
  state,
  navigation,
  tabs,
  primaryColor,
  inactiveColor,
  backgroundColor,
  opacity,
  cornerRadius,
  floating,
  floatingMargin,
  labeled,
  blurRadius,
  isDark,
}) => {
  const bgColor = isDark ? DEFAULTS.DARK_BACKGROUND : backgroundColor;
  const screenBgColor = isDark
    ? DEFAULTS.DARK_SCREEN_BACKGROUND
    : DEFAULTS.LIGHT_SCREEN_BACKGROUND;

  const selectorScales = useRef<Animated.Value[]>(
    tabs.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  const [tabLayouts, setTabLayouts] = useState<
    Record<number, { x: number; width: number; height: number }>
  >({});

  const glassConfig = useMemo(
    () => ({
      cornerRadius,
      opacity,
      blurRadius,
      backgroundColor: bgColor,
      darkMode: isDark,
    }),
    [cornerRadius, opacity, blurRadius, bgColor, isDark]
  );

  const fadeConfig = useMemo(
    () => ({ backgroundColor: screenBgColor, darkMode: isDark }),
    [screenBgColor, isDark]
  );

  useEffect(() => {
    const animations = selectorScales.map((scale, i) =>
      Animated.timing(scale, {
        toValue: state.index === i ? 1 : 0,
        duration: DEFAULTS.SELECTOR_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, [state.index, selectorScales]);

  const onTabLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width, height } = event.nativeEvent.layout;
    setTabLayouts((prev) => ({ ...prev, [index]: { x, width, height } }));
  }, []);

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <GlassFadeNativeView
        fadeConfig={fadeConfig}
        style={styles.fadeGradient}
      />

      <View
        style={[
          styles.barWrapper,
          {
            paddingHorizontal: floating ? floatingMargin : 0,
            paddingBottom: floating ? floatingMargin + 16 : 16,
          },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.barContainer,
            { maxWidth: DEFAULTS.MAX_TAB_BAR_WIDTH },
          ]}
        >
          <GlassBarNativeView
            glassConfig={glassConfig}
            style={[styles.nativeGlass, { borderRadius: cornerRadius }]}
          />

          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const tab = tabs[index]!;
            const iconColor = isFocused ? primaryColor : inactiveColor;
            const layout = tabLayouts[index];

            const selectorScale = selectorScales[index]!.interpolate({
              inputRange: [0, 1],
              outputRange: [
                DEFAULTS.SELECTOR_SCALE_FROM,
                DEFAULTS.SELECTOR_SCALE_TO,
              ],
            });
            const selectorOpacity = selectorScales[index]!.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableWithoutFeedback
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={tab.accessibilityLabel}
                testID={tab.testID}
              >
                <View
                  style={styles.tabItem}
                  onLayout={(e) => onTabLayout(index, e)}
                >
                  <Animated.View
                    style={[
                      styles.selector,
                      {
                        backgroundColor: primaryColor,
                        opacity: Animated.multiply(
                          selectorOpacity,
                          DEFAULTS.SELECTOR_ALPHA
                        ),
                        borderRadius: layout
                          ? Math.min(
                              layout.width - 12,
                              DEFAULTS.TAB_BAR_HEIGHT - 12
                            ) / 2
                          : 22,
                        transform: [{ scale: selectorScale }],
                      },
                    ]}
                  />

                  <View style={styles.iconWrapper}>
                    <AnimatedTabIcon
                      tab={tab}
                      focused={isFocused}
                      color={iconColor}
                    />

                    {tab.badge != null && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {typeof tab.badge === 'number' &&
                          tab.badge > DEFAULTS.BADGE_MAX
                            ? `${DEFAULTS.BADGE_MAX}+`
                            : String(tab.badge)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {labeled && (
                    <Text
                      style={[
                        styles.label,
                        { color: iconColor },
                        isFocused && styles.labelFocused,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.title}
                    </Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default GlassTabBar;
