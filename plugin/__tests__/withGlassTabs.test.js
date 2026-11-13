const { setMaterial3Theme, MATERIAL3_PARENT } = require('../withGlassTabs');

describe('setMaterial3Theme', () => {
  it('switches an AppCompat app theme to Material 3, keeping its items', () => {
    const styles = {
      resources: {
        style: [
          {
            $: { name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar' },
            item: [{ $: { name: 'android:editTextBackground' }, _: '@drawable/rn_edit_text_material' }],
          },
        ],
      },
    };
    const out = setMaterial3Theme(styles);
    expect(out.resources.style[0].$.parent).toBe(MATERIAL3_PARENT);
    expect(out.resources.style[0].item).toHaveLength(1);
  });

  it('leaves an existing Material 3 theme alone', () => {
    const styles = { resources: { style: [{ $: { name: 'AppTheme', parent: 'Theme.Material3.Light' } }] } };
    expect(setMaterial3Theme(styles).resources.style[0].$.parent).toBe('Theme.Material3.Light');
  });

  it('adds the theme when there is none', () => {
    const out = setMaterial3Theme({});
    expect(out.resources.style).toEqual([{ $: { name: 'AppTheme', parent: MATERIAL3_PARENT }, item: [] }]);
  });

  it('supports a custom theme name and parent', () => {
    const out = setMaterial3Theme({}, 'MyTheme', 'Theme.Material3.Light.NoActionBar');
    expect(out.resources.style[0].$).toEqual({ name: 'MyTheme', parent: 'Theme.Material3.Light.NoActionBar' });
  });
});
