jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
}));

import { styles, iconStyles, ICON_SIZE } from '../styles';

describe('GlassTabBar styles', () => {
  it('outerWrapper is absolute positioned at bottom', () => {
    expect(styles.outerWrapper.position).toBe('absolute');
    expect(styles.outerWrapper.bottom).toBe(0);
  });

  it('barContainer has correct height', () => {
    expect(styles.barContainer.height).toBe(56);
  });

  it('barContainer uses row direction', () => {
    expect(styles.barContainer.flexDirection).toBe('row');
  });

  it('nativeGlass fills parent absolutely', () => {
    expect(styles.nativeGlass.position).toBe('absolute');
    expect(styles.nativeGlass.top).toBe(0);
    expect(styles.nativeGlass.left).toBe(0);
    expect(styles.nativeGlass.right).toBe(0);
    expect(styles.nativeGlass.bottom).toBe(0);
  });

  it('selector has equal padding on all sides', () => {
    expect(styles.selector.top).toBe(styles.selector.bottom);
    expect(styles.selector.left).toBe(styles.selector.right);
  });

  it('badge is positioned on icon', () => {
    expect(styles.badge.position).toBe('absolute');
    expect(styles.badge.top).toBeLessThan(0);
    expect(styles.badge.right).toBeLessThan(0);
  });

  it('badge uses red background', () => {
    expect(styles.badge.backgroundColor).toBe('#FF3B30');
  });

  it('label font size matches Telegram spec', () => {
    expect(styles.label.fontSize).toBe(12);
  });

  it('focused label has heavier weight', () => {
    expect(styles.labelFocused.fontWeight).toBe('500');
  });
});

describe('iconStyles', () => {
  it('ICON_SIZE is 20', () => {
    expect(ICON_SIZE).toBe(20);
  });

  it('container matches icon size', () => {
    expect(iconStyles.container.width).toBe(ICON_SIZE);
    expect(iconStyles.container.height).toBe(ICON_SIZE);
  });

  it('iconLayer is absolute for stacking', () => {
    expect(iconStyles.iconLayer.position).toBe('absolute');
  });
});
