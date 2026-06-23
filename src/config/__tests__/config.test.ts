import { DEFAULTS } from '../defaults';

describe('DEFAULTS', () => {
  describe('Telegram dimensions', () => {
    it('tab bar height is 56dp', () => {
      expect(DEFAULTS.TAB_BAR_HEIGHT).toBe(56);
    });
    it('corner radius is 28dp (full pill)', () => {
      expect(DEFAULTS.CORNER_RADIUS).toBe(28);
    });
    it('bar margin is 8dp', () => {
      expect(DEFAULTS.TAB_BAR_MARGIN).toBe(8);
    });
    it('max width is 344dp', () => {
      expect(DEFAULTS.MAX_TAB_BAR_WIDTH).toBe(344);
    });
    it('total height with margins is 72dp', () => {
      expect(DEFAULTS.TAB_BAR_TOTAL_HEIGHT).toBe(72);
    });
  });

  describe('animation values', () => {
    it('selector scales from 0.6 to 1.0', () => {
      expect(DEFAULTS.SELECTOR_SCALE_FROM).toBe(0.6);
      expect(DEFAULTS.SELECTOR_SCALE_TO).toBe(1.0);
    });
    it('selector duration is 320ms', () => {
      expect(DEFAULTS.SELECTOR_DURATION).toBe(320);
    });
    it('selector alpha is 9%', () => {
      expect(DEFAULTS.SELECTOR_ALPHA).toBe(0.09);
    });
  });

  describe('glass effect', () => {
    it('default opacity is 0.85', () => {
      expect(DEFAULTS.OPACITY).toBe(0.85);
    });
    it('blur radius is 25', () => {
      expect(DEFAULTS.BLUR_RADIUS).toBe(25);
    });
    it('fade height is 100', () => {
      expect(DEFAULTS.FADE_HEIGHT).toBe(100);
    });
  });

  describe('icon and label', () => {
    it('icon size is 20dp', () => {
      expect(DEFAULTS.ICON_SIZE).toBe(20);
    });
    it('label font size is 12sp', () => {
      expect(DEFAULTS.LABEL_FONT_SIZE).toBe(12);
    });
  });

  describe('badge', () => {
    it('badge max is 99', () => {
      expect(DEFAULTS.BADGE_MAX).toBe(99);
    });
    it('badge height is 16dp', () => {
      expect(DEFAULTS.BADGE_HEIGHT).toBe(16);
    });
    it('badge min width is 16dp', () => {
      expect(DEFAULTS.BADGE_MIN_WIDTH).toBe(16);
    });
  });

  describe('boolean defaults', () => {
    it('floating is true', () => {
      expect(DEFAULTS.FLOATING).toBe(true);
    });
    it('labeled is true', () => {
      expect(DEFAULTS.LABELED).toBe(true);
    });
    it('haptic feedback is true', () => {
      expect(DEFAULTS.HAPTIC_FEEDBACK).toBe(true);
    });
    it('translucent is true', () => {
      expect(DEFAULTS.TRANSLUCENT).toBe(true);
    });
  });
});
