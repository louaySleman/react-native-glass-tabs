#import <React/RCTViewManager.h>
#import <React/RCTView.h>
#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>

/**
 * iOS side of <BlurView> / <LiquidGlassView> / <GlassView>: the system's own glass behind any
 * React children.
 *
 *  - effect "liquid": Apple's liquid glass (UIGlassEffect) on iOS 26+, the frosted material
 *    before that.
 *  - effect "blur": the system frosted materials (thin → regular, by blurRadius).
 *
 * Both follow light / dark mode by themselves. The tint (backgroundColor at backgroundOpacity %)
 * sits between the glass and the content.
 */
@interface GlassNativeIOSView : RCTView
@property (nonatomic, copy) NSDictionary *glassConfig;
@property (nonatomic, copy) RCTDirectEventBlock onBackdropChange;
@end

@implementation GlassNativeIOSView {
  UIVisualEffectView *_effectView;
  UIView *_tintView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _effectView = [[UIVisualEffectView alloc] initWithEffect:nil];
    _effectView.userInteractionEnabled = NO;
    _effectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _tintView = [[UIView alloc] initWithFrame:CGRectZero];
    _tintView.userInteractionEnabled = NO;
    _tintView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self insertSubview:_effectView atIndex:0];
    [self insertSubview:_tintView atIndex:1];
    self.clipsToBounds = YES;
    self.layer.cornerCurve = kCACornerCurveContinuous;
  }
  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _effectView.frame = self.bounds;
  _tintView.frame = self.bounds;
  // Keep the glass behind every React child, whatever order they were mounted in.
  [self sendSubviewToBack:_tintView];
  [self sendSubviewToBack:_effectView];
}

- (void)setGlassConfig:(NSDictionary *)config
{
  _glassConfig = [config copy];
  NSString *effect = [RCTConvert NSString:config[@"effect"]] ?: @"blur";
  CGFloat radius = config[@"cornerRadius"] ? [RCTConvert CGFloat:config[@"cornerRadius"]] : 0;
  CGFloat blur = config[@"blurRadius"] ? [RCTConvert CGFloat:config[@"blurRadius"]] : 25;
  UIColor *tint = config[@"backgroundColor"] ? [RCTConvert UIColor:config[@"backgroundColor"]] : nil;
  CGFloat pct = config[@"backgroundOpacity"] && config[@"backgroundOpacity"] != [NSNull null]
    ? [RCTConvert CGFloat:config[@"backgroundOpacity"]] : -1;

  self.layer.cornerRadius = radius;

  UIVisualEffect *visual = nil;
  BOOL liquid = [effect isEqualToString:@"liquid"];
#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  // Built with the iOS 26+ SDK (Xcode 26+): Apple's liquid glass when running on iOS 26+.
  if (liquid) {
    if (@available(iOS 26.0, *)) {
      UIGlassEffect *glass = [UIGlassEffect effectWithStyle:UIGlassEffectStyleRegular];
      visual = glass;
    }
  }
#endif
  if (visual == nil) {
    UIBlurEffectStyle style = blur <= 8 ? UIBlurEffectStyleSystemUltraThinMaterial
      : blur <= 16 ? UIBlurEffectStyleSystemThinMaterial
      : UIBlurEffectStyleSystemMaterial;
    visual = [UIBlurEffect effectWithStyle:style];
  }
  _effectView.effect = visual;

  // The system materials are already tinted; the tint here is extra, and lighter on liquid glass.
  CGFloat alpha = pct >= 0 ? pct / 100.0 : (liquid ? 0.0 : 0.15);
  _tintView.backgroundColor = tint ? [tint colorWithAlphaComponent:MIN(1, MAX(0, alpha))] : UIColor.clearColor;
  [self setNeedsLayout];
}

@end

@interface GlassNativeViewManager : RCTViewManager
@end

@implementation GlassNativeViewManager

RCT_EXPORT_MODULE(GlassNativeView)

- (UIView *)view
{
  return [GlassNativeIOSView new];
}

RCT_EXPORT_VIEW_PROPERTY(glassConfig, NSDictionary)
// Android measures what shows through; iOS materials adapt by themselves. Accepted for parity.
RCT_EXPORT_VIEW_PROPERTY(onBackdropChange, RCTDirectEventBlock)

@end
