import type {
  GlassTabsProps,
  TabConfig,
  IconRenderProps,
  PlatformIcons,
} from '../glassTabs';

describe('TabConfig', () => {
  it('accepts minimal config', () => {
    const config: TabConfig = {
      name: 'Home',
      component: () => null,
      title: 'Home',
      renderIcon: () => null,
    };
    expect(config.name).toBe('Home');
  });

  it('accepts full config with all optional fields', () => {
    const config: TabConfig = {
      name: 'Search',
      component: () => null,
      title: 'Search',
      role: 'search',
      badge: 5,
      header: false,
      renderIcon: {
        sfSymbol: 'magnifyingglass',
        render: (_props: IconRenderProps) => null,
      },
    };
    expect(config.role).toBe('search');
    expect(config.badge).toBe(5);
    expect((config.renderIcon as PlatformIcons).sfSymbol).toBe(
      'magnifyingglass'
    );
    expect(config.header).toBe(false);
  });

  it('badge accepts string value', () => {
    const config: TabConfig = {
      name: 'Chat',
      component: () => null,
      title: 'Chat',
      badge: '99+',
      renderIcon: () => null,
    };
    expect(config.badge).toBe('99+');
  });

  it('badge accepts number value', () => {
    const config: TabConfig = {
      name: 'Chat',
      component: () => null,
      title: 'Chat',
      badge: 42,
      renderIcon: () => null,
    };
    expect(config.badge).toBe(42);
  });
});

describe('GlassTabsProps', () => {
  it('accepts only required tabs prop', () => {
    const props: GlassTabsProps = {
      tabs: [],
    };
    expect(props.tabs).toHaveLength(0);
  });

  it('accepts all optional props', () => {
    const props: GlassTabsProps = {
      tabs: [],
      primaryColor: '#FF0000',
      inactiveColor: '#888888',
      backgroundColor: '#FFFFFF',
      opacity: 0.9,
      cornerRadius: 20,
      floating: false,
      floatingMargin: 12,
      hapticFeedback: false,
      labeled: false,
      blurRadius: 30,
      initialRouteName: 'Home',
      translucent: false,
    };
    expect(props.opacity).toBe(0.9);
    expect(props.floating).toBe(false);
    expect(props.blurRadius).toBe(30);
  });
});

describe('IconRenderProps', () => {
  it('has correct shape', () => {
    const props: IconRenderProps = {
      color: '#007AFF',
      size: 20,
      focused: true,
    };
    expect(props.color).toBe('#007AFF');
    expect(props.size).toBe(20);
    expect(props.focused).toBe(true);
  });

  it('works with unfocused state', () => {
    const props: IconRenderProps = {
      color: '#8E8E93',
      size: 20,
      focused: false,
    };
    expect(props.focused).toBe(false);
  });
});
