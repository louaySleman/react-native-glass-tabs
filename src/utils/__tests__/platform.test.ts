describe('isLiquidGlassSupported', () => {
  beforeEach(() => jest.resetModules());

  it('returns true on iOS 26', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '26' },
    }));
    const { isLiquidGlassSupported } = require('../platform');
    expect(isLiquidGlassSupported()).toBe(true);
  });

  it('returns true on iOS 27', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '27' },
    }));
    const { isLiquidGlassSupported } = require('../platform');
    expect(isLiquidGlassSupported()).toBe(true);
  });

  it('returns false on iOS 18', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '18' },
    }));
    const { isLiquidGlassSupported } = require('../platform');
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it('returns false on iOS 25', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '25' },
    }));
    const { isLiquidGlassSupported } = require('../platform');
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it('returns false on Android regardless of version', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android', Version: 35 },
    }));
    const { isLiquidGlassSupported } = require('../platform');
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it('handles numeric iOS version', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: 26 },
    }));
    const { isLiquidGlassSupported } = require('../platform');
    expect(isLiquidGlassSupported()).toBe(true);
  });
});

describe('getAndroidApiLevel', () => {
  beforeEach(() => jest.resetModules());

  it('returns API level on Android', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android', Version: 31 },
    }));
    const { getAndroidApiLevel } = require('../platform');
    expect(getAndroidApiLevel()).toBe(31);
  });

  it('returns 0 on iOS', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: '26' },
    }));
    const { getAndroidApiLevel } = require('../platform');
    expect(getAndroidApiLevel()).toBe(0);
  });

  it('returns 0 for non-numeric Android version', () => {
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android', Version: 'unknown' },
    }));
    const { getAndroidApiLevel } = require('../platform');
    expect(getAndroidApiLevel()).toBe(0);
  });
});
