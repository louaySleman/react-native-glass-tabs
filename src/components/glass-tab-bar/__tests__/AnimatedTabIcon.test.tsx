import type { TabConfig } from '../../../types/glassTabs';
import { resolveIcon } from '../../../utils/platform';

describe('AnimatedTabIcon', () => {
  const createMockTab = (renderIcon = jest.fn(() => null)): TabConfig => ({
    name: 'Home',
    component: () => null,
    title: 'Home',
    renderIcon,
  });

  it('renderIcon receives correct props when focused', () => {
    const renderIcon = jest.fn(() => null);
    const tab = createMockTab(renderIcon);
    resolveIcon(tab.renderIcon)({ color: '#007AFF', size: 20, focused: true });
    expect(renderIcon).toHaveBeenCalledWith({
      color: '#007AFF',
      size: 20,
      focused: true,
    });
  });

  it('renderIcon receives correct props when unfocused', () => {
    const renderIcon = jest.fn(() => null);
    const tab = createMockTab(renderIcon);
    resolveIcon(tab.renderIcon)({ color: '#8E8E93', size: 20, focused: false });
    expect(renderIcon).toHaveBeenCalledWith({
      color: '#8E8E93',
      size: 20,
      focused: false,
    });
  });

  it('renderIcon receives size matching ICON_SIZE', () => {
    const renderIcon = jest.fn(() => null);
    const tab = createMockTab(renderIcon);
    const ICON_SIZE = 20;
    resolveIcon(tab.renderIcon)({
      color: '#000',
      size: ICON_SIZE,
      focused: false,
    });
    expect(renderIcon).toHaveBeenCalledWith(
      expect.objectContaining({ size: ICON_SIZE })
    );
  });

  it('both focused and unfocused icons use same size', () => {
    const renderIcon = jest.fn(() => null);
    const tab = createMockTab(renderIcon);
    const resolve = resolveIcon(tab.renderIcon);
    resolve({ color: '#007AFF', size: 20, focused: true });
    resolve({ color: '#8E8E93', size: 20, focused: false });
    expect(renderIcon).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ size: 20 })
    );
    expect(renderIcon).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ size: 20 })
    );
  });

  it('resolves platform-specific icons object', () => {
    const renderFn = jest.fn(() => null);
    const tab = createMockTab();
    tab.renderIcon = { sfSymbol: 'house.fill', render: renderFn };
    const resolved = resolveIcon(tab.renderIcon);
    resolved({ color: '#007AFF', size: 20, focused: true });
    expect(renderFn).toHaveBeenCalledWith({
      color: '#007AFF',
      size: 20,
      focused: true,
    });
  });
});
