#ifdef RCT_NEW_ARCH_ENABLED
#import "RNGlassTabsSpec.h"

@interface GlassTabs : NSObject <NativeGlassTabsSpec>
#else
#import <React/RCTBridgeModule.h>

@interface GlassTabs : NSObject <RCTBridgeModule>
#endif

@end
