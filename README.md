# 3D City Carbon Footprint Visualizer

## Overview
The 3D City Carbon Footprint Visualizer is an interactive web application that helps individuals understand, track, and reduce their carbon footprint through a personalized 3D digital twin of a city. The city's environment dynamically responds to user inputs related to daily travel and dietary habits, visualizing the direct impact of these choices on the environment.

## Features
- **3D Digital Twin**: A fully interactive 3D city scene rendered using Three.js, complete with buildings, vegetation, and atmospheric effects.
- **Dynamic Environmental Degradation**: The visual state of the city changes based on the calculated Carbon Score. High emissions result in smog, dead vegetation, dried water, and an overheated atmosphere, while low emissions lead to a pristine, green, and vibrant ecosystem.
- **Interactive Dashboard**: A desktop control panel allowing users to adjust their daily habits (car travel, public transit, active travel, dietary choices) and instantly see the environmental impact.
- **Mobile Companion Mockup**: An integrated phone overlay UI that simulates a mobile app for tracking GPS routes, logging diet, and viewing historical insights.
- **Carbon Engine Calculation**: A built-in engine that normalizes various emission sources into a unified Carbon Score (0-100).

## Technology Stack
- **Frontend Tooling**: Vite
- **Language**: Vanilla JavaScript, HTML5, CSS3
- **3D Rendering**: Three.js

## Project Structure
- `src/main.js`: The main entry point. Initializes the Three.js scene, camera, renderer, and handles the UI interactions for both the desktop dashboard and the mobile companion.
- `src/style.css`: Contains all styling for the UI elements, including the dashboard, mobile overlay, and layout structure.
- `src/cityGenerator.js`: Responsible for procedurally generating the 3D city assets (ground plane, buildings, trees, windmills, factories) and managing the 3D materials.
- `src/carbonEngine.js`: Handles the logic for calculating daily emissions based on user inputs and mapping them to a normalized 0-100 Carbon Score.
- `src/degradationModel.js`: Manages the visual transition of the 3D scene (colors, lighting, fog) based on the current Carbon Score.
- `src/appState.js`: Maintains the global state of the application, such as current daily activity parameters and metrics.
- `index.html`: The main HTML file containing the UI structure and the canvas for 3D rendering.

## How It Works
1. **User Input**: Users interact with the dashboard to set their daily activities, such as kilometers driven, transit usage, and dietary habits.
2. **Score Calculation**: The `CarbonEngine` takes these inputs, applies specific emission factors (e.g., CO2 per km for a car, CO2 per day for a specific diet), and calculates a total daily CO2e. This value is then normalized into a Carbon Score from 0 (Eco-Hero) to 100 (High Consumer).
3. **Visual Degradation**: The `DegradationModel` listens to the Carbon Score and adjusts the Three.js scene parameters. For instance, a high score will shift the sky color to grey/brown, increase fog density, change tree colors to brown, and alter water textures.
4. **Rendering Loop**: The Three.js animation loop in `main.js` continuously renders the scene, applying any visual changes and animating dynamic elements like windmills and factory smoke particles.

## Running Locally
1. Ensure you have Node.js installed.
2. Clone this repository or navigate to the project directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open the provided localhost URL in your browser to view the application.
