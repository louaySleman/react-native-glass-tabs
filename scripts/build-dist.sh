#!/bin/bash
set -e

DIST_DIR="dist"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building react-native-glass-tabs for distribution..."

# Clean previous dist
rm -rf "$ROOT_DIR/$DIST_DIR"
mkdir -p "$ROOT_DIR/$DIST_DIR"

# Build type definitions
cd "$ROOT_DIR"
npx bob build

# Copy lib/typescript (type definitions only)
mkdir -p "$ROOT_DIR/$DIST_DIR/lib"
cp -r "$ROOT_DIR/lib/typescript" "$ROOT_DIR/$DIST_DIR/lib/typescript"
rm -rf "$ROOT_DIR/$DIST_DIR/lib/typescript/__tests__"

# Copy android native code (only src and build config)
mkdir -p "$ROOT_DIR/$DIST_DIR/android"
cp "$ROOT_DIR/android/build.gradle" "$ROOT_DIR/$DIST_DIR/android/"
cp "$ROOT_DIR/android/gradle.properties" "$ROOT_DIR/$DIST_DIR/android/"
cp -r "$ROOT_DIR/android/src" "$ROOT_DIR/$DIST_DIR/android/src"

# Copy ios native code
mkdir -p "$ROOT_DIR/$DIST_DIR/ios"
cp "$ROOT_DIR/ios/GlassTabs.podspec" "$ROOT_DIR/$DIST_DIR/ios/"
cp "$ROOT_DIR/ios/GlassTabs.h" "$ROOT_DIR/$DIST_DIR/ios/"
cp "$ROOT_DIR/ios/GlassTabs.mm" "$ROOT_DIR/$DIST_DIR/ios/"

# Copy src (Metro resolves this at runtime + codegen needs it)
cp -r "$ROOT_DIR/src" "$ROOT_DIR/$DIST_DIR/src"
for tests_dir in "$ROOT_DIR/$DIST_DIR/src"/*/__tests__; do
  [ -d "$tests_dir" ] && rm -rf "$tests_dir"
done
rm -rf "$ROOT_DIR/$DIST_DIR/src/__tests__"

# Copy package files
cp "$ROOT_DIR/package.json" "$ROOT_DIR/$DIST_DIR/"
cp "$ROOT_DIR/README.md" "$ROOT_DIR/$DIST_DIR/"
cp "$ROOT_DIR/LICENSE" "$ROOT_DIR/$DIST_DIR/"

# Strip dev-only fields so `npm publish` does not re-run bob build in dist/
export ROOT_DIR DIST_DIR
node <<'NODE'
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.env.ROOT_DIR, process.env.DIST_DIR, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

delete pkg.scripts.prepack;
delete pkg.scripts.build;
delete pkg.scripts['build:dist'];
delete pkg.scripts.release;
delete pkg.scripts.test;
delete pkg.scripts.lint;
delete pkg.scripts.typecheck;
delete pkg.scripts.format;
delete pkg.scripts.clean;

delete pkg.devDependencies;
delete pkg.dependencies;
delete pkg['release-it'];
delete pkg.commitlint;
delete pkg.jest;
delete pkg.eslintConfig;
delete pkg.eslintIgnore;
delete pkg.prettier;
delete pkg['react-native-builder-bob'];

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
NODE

echo ""
echo "Done! dist/ is ready for publish."
echo ""
echo "To publish:"
echo "  cd dist && npm publish"
echo ""
echo "Contents:"
find "$ROOT_DIR/$DIST_DIR" -type f | wc -l | awk '{print "  Files:", $1}'
du -sh "$ROOT_DIR/$DIST_DIR" | awk '{print "  Size:", $1}'
