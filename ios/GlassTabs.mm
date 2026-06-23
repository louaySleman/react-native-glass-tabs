#import "GlassTabs.h"

@implementation GlassTabs
RCT_EXPORT_MODULE()

// iOS glass effects are handled entirely in JavaScript via
// @bottom-tabs/react-navigation (liquid glass) and
// @react-navigation/bottom-tabs (standard).
// This native module is a minimal stub for the TurboModule codegen.

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeGlassTabsSpecJSI>(params);
}
#endif

@end
