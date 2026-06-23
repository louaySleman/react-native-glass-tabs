import React, { useRef, useEffect, useMemo } from 'react';
import { View, Animated, Easing } from 'react-native';
import type { TabConfig } from '../../types/glassTabs';
import { resolveIcon } from '../../utils/platform';
import { iconStyles, ICON_SIZE } from './styles';

interface AnimatedTabIconProps {
  tab: TabConfig;
  focused: boolean;
  color: string;
}

/**
 * Crossfades between outline and filled icon states.
 * Renders both icons stacked, animates opacity over 200ms.
 */
const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  tab,
  focused,
  color,
}) => {
  const fadeAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const iconRenderer = useMemo(
    () => resolveIcon(tab.renderIcon),
    [tab.renderIcon]
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [focused, fadeAnim]);

  return (
    <View style={iconStyles.container}>
      <Animated.View
        style={[
          iconStyles.iconLayer,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        {iconRenderer({ color, size: ICON_SIZE, focused: false })}
      </Animated.View>
      <Animated.View style={[iconStyles.iconLayer, { opacity: fadeAnim }]}>
        {iconRenderer({ color, size: ICON_SIZE, focused: true })}
      </Animated.View>
    </View>
  );
};

export default AnimatedTabIcon;
