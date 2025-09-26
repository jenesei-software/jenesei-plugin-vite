# @jenesei-software/jenesei-plugin-vite

Collection of Vite plugins for automated project maintenance and asset generation.

## Features

This library provides two main Vite plugins:

1. **pluginUpdateIcons** - Automatically generates multiple icon sizes and formats from a source image
2. **pluginUpdateReadmePD** - Automatically updates README.md with peer dependency installation instructions

## Plugins

### pluginUpdateIcons

Automatically generates icon files in various sizes and formats from a single source image using Sharp. Perfect for generating PWA icons, favicons, and application icons.

**Parameters:**
- `sizesBackgroundTransparent: number[]` - Array of pixel sizes for transparent background icons
- `sizesBackgroundWhite: number[]` - Array of pixel sizes for white background icons  
- `sizesFavicon: number[]` - Array of pixel sizes for favicon (.ico) files
- `prefix: string` - Filename prefix for generated icons
- `pathInputFile: string` - Path to the source image file
- `pathOutputDirectory: string` - Directory where generated icons will be saved

**Usage Example:**
```typescript
import { pluginUpdateIcons } from '@jenesei-software/jenesei-plugin-vite'

export default defineConfig({
  plugins: [
    pluginUpdateIcons({
      sizesBackgroundTransparent: [192, 512],
      sizesBackgroundWhite: [192, 512],
      sizesFavicon: [16, 32, 48],
      prefix: 'app-icon',
      pathInputFile: './src/assets/logo.png',
      pathOutputDirectory: './public/icons'
    })
  ]
})
```

**Generated Files:**
- `{prefix}-{size}x{size}.png` - Transparent background
- `{prefix}-{size}x{size}-white.png` - White background
- `{prefix}-{size}x{size}-favicon.ico` - Favicon format

### pluginUpdateReadmePD

Automatically updates your README.md file with installation instructions for all peer dependencies listed in package.json. Useful for maintaining up-to-date documentation.

**Parameters:**
- `insertionPoint: string` - Text marker in README where dependencies should be inserted
- `pathPackageJson: string` - Path to package.json file
- `pathReadme: string` - Path to README.md file

**Usage Example:**
```typescript
import { pluginUpdateReadmePD } from '@jenesei-software/jenesei-plugin-vite'

export default defineConfig({
  plugins: [
    pluginUpdateReadmePD({
      insertionPoint: '## Peer Dependencies',
      pathPackageJson: './package.json',
      pathReadme: './README.md'
    })
  ]
})
```

**How it works:**
1. Reads peer dependencies from package.json
2. Generates npm install commands for each dependency
3. Finds the insertion point in README.md
4. Updates the README with formatted installation instructions

## Installation

```bash
npm install @jenesei-software/jenesei-plugin-vite --save-dev
```

## Peer Dependencies


To work correctly you need to install the following dependencies:

```bash
npm install sharp --save
```
