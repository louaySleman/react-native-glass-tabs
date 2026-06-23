/**
 * Platform router — Metro resolves to .ios.tsx or .android.tsx.
 * This fallback handles non-standard bundlers.
 * @module components/glass-tabs
 */
import { Platform } from 'react-native';
import type React from 'react';
import type { GlassTabsProps } from '../../types/glassTabs';

let GlassTabs: React.FC<GlassTabsProps>;

if (Platform.OS === 'ios') {
  GlassTabs = require('./GlassTabs.ios').default;
} else {
  GlassTabs = require('./GlassTabs.android').default;
}

export default GlassTabs;
