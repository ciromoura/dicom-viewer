# DICOM Viewer

A simple DICOM viewer application built with Electron.js and Cornerstone.js libraries. This viewer allows you to load and view DICOM images with various tools for image manipulation and measurement.

## Features

- Load single DICOM files or entire series
- Basic image manipulation (Window/Level, Pan, Zoom)
- Measurement tools (Length, Angle, Rectangle ROI, Elliptical ROI)
- Annotation tools (Arrow)
- Series navigation
- 80/20 split layout (viewer/controls)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 14.0.0 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd dicom-viewer
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

To start the application in development mode:
```bash
npm start
```

## Usage

1. Launch the application
2. Use the "Load Single" button to open a single DICOM file
3. Use the "Load Series" button to open a directory containing DICOM files
4. Use the toolbar on the right to select different tools:
   - 🔆 Window/Level: Adjust brightness and contrast
   - ✋ Pan: Move the image around
   - 🔍 Zoom: Zoom in/out
   - 📏 Length: Measure distances
   - 📐 Angle: Measure angles
   - ⬜ Rectangle: Draw rectangle ROIs
   - ⭕ Ellipse: Draw elliptical ROIs
   - ➡️ Arrow: Add arrow annotations

## Dependencies

- Electron.js - Cross-platform desktop application framework
- Cornerstone.js - Medical imaging visualization
- Cornerstone Tools - Image manipulation and measurement tools
- Cornerstone WADO Image Loader - DICOM image loading
- Cornerstone Math - Mathematical utilities for measurements
- Hammer.js - Touch gestures support

## Development

The application consists of several key files:
- `main.js` - Main Electron process
- `renderer.js` - Renderer process with viewer logic
- `index.html` - Application UI
- `styles.css` - Application styling

## License

This project is licensed under the MIT License. 