# Legado Source Generator

A Chrome extension for generating Legado阅读 book source rules by visually selecting page elements.

## Features

- **Visual Element Picker**: Click to select any element on the page
- **Smart Selector Generation**: Automatically generates stable CSS selectors
- **Multi-step Workflow**: Step-by-step selection for book list, book item, title, author, cover, intro, and last chapter
- **Error Handling**: Warnings for Shadow DOM, iframes, dynamic classes, and invalid selectors
- **Keyboard Shortcuts**: Escape to cancel, Enter to advance
- **Export to JSON**: Generate ready-to-use Legado source rules

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select the `src` directory
4. Pin the extension for easy access

## Usage

1. Open the extension popup
2. Enter the book source name and URL base
3. Click "Start Picker" to begin element selection
4. Navigate to the target webpage
5. Hover and click to select elements for each field:
   - Book List container
   - Book Item element
   - Title
   - Author
   - Cover URL
   - Introduction
   - Last Chapter link
6. Use keyboard shortcuts:
   - `Escape`: Exit picker mode
   - `Enter`: Select current element and advance
7. Click "Export JSON" to get the generated source rule
8. Import into Legado app

## Error Warnings

The picker detects potential issues:
- **Shadow DOM**: Element inside Shadow DOM may not be selectable
- **Iframe**: Cross-origin restrictions may apply
- **Dynamic Class**: Auto-generated class names may be unstable
- **Empty Selector**: No valid element selected
- **No Match**: Selector returns zero elements

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Escape | Exit picker mode |
| Enter | Select hovered element and advance |

## Project Structure

```
src/
├── manifest.json      # Extension manifest
├── content/
│   ├── picker.js      # Element picker logic
│   └── picker.css     # Picker styles
├── popup/
│   ├── index.html     # Popup UI
│   ├── popup.js       # Popup logic
│   └── popup.css      # Popup styles
└── lib/
    └── selector-generator.js  # CSS selector generation
```
