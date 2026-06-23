module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // disable auto-linking, we handle fonts via Info.plist
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
};
