import { hexToRgba, withAlpha } from '../colors';

describe('hexToRgba', () => {
  it('converts 6-char hex with alpha', () => {
    expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('converts 3-char shorthand hex', () => {
    expect(hexToRgba('#F00', 1)).toBe('rgba(255, 0, 0, 1)');
  });

  it('handles white with fractional alpha', () => {
    expect(hexToRgba('#FFFFFF', 0.85)).toBe('rgba(255, 255, 255, 0.85)');
  });

  it('handles hex without # prefix', () => {
    expect(hexToRgba('007AFF', 0.8)).toBe('rgba(0, 122, 255, 0.8)');
  });

  it('handles zero alpha', () => {
    expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
  });

  it('handles full alpha', () => {
    expect(hexToRgba('#1C1C1E', 1)).toBe('rgba(28, 28, 30, 1)');
  });
});

describe('withAlpha', () => {
  it('appends ff for full opacity', () => {
    expect(withAlpha('#FF0000', 1)).toBe('#FF0000ff');
  });

  it('appends 80 for 50% opacity', () => {
    expect(withAlpha('#FFFFFF', 0.5)).toBe('#FFFFFF80');
  });

  it('appends 00 for zero opacity', () => {
    expect(withAlpha('#000000', 0)).toBe('#00000000');
  });

  it('strips existing 8-char alpha before appending', () => {
    expect(withAlpha('#FF0000AA', 0.5)).toBe('#FF000080');
  });

  it('handles hex without # prefix', () => {
    expect(withAlpha('007AFF', 0.18)).toBe('#007AFF2e');
  });
});
