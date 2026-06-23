describe('GlassTabs platform routing', () => {
  beforeEach(() => jest.resetModules());

  it('exports a default component on android', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android', Version: 31 },
      StyleSheet: { create: (s: any) => s },
      View: 'View',
      Text: 'Text',
      Animated: {
        Value: jest.fn(() => ({ interpolate: jest.fn() })),
        View: 'Animated.View',
        timing: jest.fn(() => ({ start: jest.fn() })),
        parallel: jest.fn(() => ({ start: jest.fn() })),
        multiply: jest.fn(),
      },
      TouchableWithoutFeedback: 'TouchableWithoutFeedback',
      useColorScheme: jest.fn(() => 'light'),
      requireNativeComponent: jest.fn(() => 'NativeView'),
      Easing: { out: jest.fn(() => jest.fn()), ease: jest.fn() },
    }));
    jest.doMock(
      '@react-navigation/bottom-tabs',
      () => ({
        createBottomTabNavigator: jest.fn(() => ({
          Navigator: 'Navigator',
          Screen: 'Screen',
        })),
      }),
      { virtual: true }
    );

    const mod = require('../GlassTabs');
    expect(mod.default).toBeDefined();
  });

  it('exports a default component on ios', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '18' },
      StyleSheet: { create: (s: any) => s },
    }));
    jest.doMock(
      '@react-navigation/bottom-tabs',
      () => ({
        createBottomTabNavigator: jest.fn(() => ({
          Navigator: 'Navigator',
          Screen: 'Screen',
        })),
      }),
      { virtual: true }
    );

    const mod = require('../GlassTabs');
    expect(mod.default).toBeDefined();
  });
});

describe('Liquid glass detection logic', () => {
  beforeEach(() => jest.resetModules());

  it('isLiquidGlassSupported returns true for iOS 26+', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '26' },
    }));
    const { isLiquidGlassSupported } = require('../../../utils/platform');
    expect(isLiquidGlassSupported()).toBe(true);
  });

  it('isLiquidGlassSupported returns false for iOS 18', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '18' },
    }));
    const { isLiquidGlassSupported } = require('../../../utils/platform');
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it('isLiquidGlassSupported returns false for Android', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android', Version: 35 },
    }));
    const { isLiquidGlassSupported } = require('../../../utils/platform');
    expect(isLiquidGlassSupported()).toBe(false);
  });
});
