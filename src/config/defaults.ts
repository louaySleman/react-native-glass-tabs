/**
 * Default configuration values for GlassTabs.
 * Design constants from Telegram's open source Android client.
 */
export const DEFAULTS = {
  TAB_BAR_HEIGHT: 56,
  TAB_BAR_MARGIN: 8,
  TAB_BAR_TOTAL_HEIGHT: 72,
  MAX_TAB_BAR_WIDTH: 344,
  CORNER_RADIUS: 28,
  PRIMARY_COLOR: '#007AFF',
  INACTIVE_COLOR: '#8E8E93',
  BACKGROUND_COLOR: '#FFFFFF',
  OPACITY: 0.85,
  SELECTOR_ALPHA: 0.09,
  BLUR_RADIUS: 25,
  FADE_HEIGHT: 100,
  ICON_SIZE: 20,
  LABEL_FONT_SIZE: 12,
  SELECTOR_SCALE_FROM: 0.6,
  SELECTOR_SCALE_TO: 1.0,
  SELECTOR_DURATION: 320,
  BADGE_MAX: 99,
  BADGE_HEIGHT: 16,
  BADGE_MIN_WIDTH: 16,
  BADGE_RADIUS: 9.333,
  BADGE_TEXT_SIZE: 10,
  FLOATING: true,
  HAPTIC_FEEDBACK: true,
  LABELED: true,
  TRANSLUCENT: true,
  /** iOS system dark background (systemGray6). */
  DARK_BACKGROUND: '#1C1C1E',
  /** iOS system dark inactive tint (systemGray). */
  DARK_INACTIVE: '#8E8E93',
  /** iOS system dark screen background. */
  DARK_SCREEN_BACKGROUND: '#000000',
  /** iOS system light grouped background. */
  LIGHT_SCREEN_BACKGROUND: '#F2F2F7',
} as const;
