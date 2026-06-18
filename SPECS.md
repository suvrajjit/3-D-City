# Carbon Footprint Visualizer - Project Specification

## Problem Statement

Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

---

# Core Idea

Humans often struggle to understand abstract numerical values such as carbon footprint scores.

This project converts carbon footprint data into a visual, interactive 3D city that evolves based on the user's environmental impact.

The goal is to make climate impact tangible and understandable rather than presenting users with charts and numbers alone.

---

# Solution Overview

The solution consists of two components:

## Part 1: Mobile Application

Purpose:

* Track user activity to:
* Generate carbon score
* Provide personalized recommendations

### Data Collected

Current scope:

* Transportation habits
* Food habits- detection using category based user-input everyday (Ex: "I mostly had veg/non-veg today")

Future scope:

* Energy usage

### Transportation Detection

The application estimates transportation mode using:

* GPS location
* Distance travelled
* Travel time
* Average speed

Current approach:

* Heuristic based
* Not guaranteed to be 100% accurate

Known limitations:

* Traffic congestion may affect speed calculations
* Cars, buses and other transport methods may have overlapping speed ranges

Future improvements:

* Activity Recognition APIs
* User feedback
* Maps integration

### Personalized Insights

The system analyzes historical travel patterns.

Example:

Home → College

Repeated:

* Monday
* Tuesday
* Wednesday
* Thursday
* Friday

Time:

8:00 AM - 9:00 AM

The application predicts recurring travel events and suggests lower-emission alternatives when appropriate.

Current implementation:

* Rule-based pattern detection
* No machine learning required

Future improvements:

* ML based prediction

### Notifications

Purpose:

Provide non-intrusive recommendations.

Example:

"You usually travel to college around this time. A metro station is available nearby and could reduce emissions."

Current status:

Concept only.

App-opening detection is considered high-risk due to Android privacy restrictions and is out of scope for the prototype.

Preferred approach:

Behavioral prediction based on travel patterns.

---

## Part 2: 3D Environmental Visualization

Purpose:

Help users understand the consequences of their carbon footprint through an evolving virtual city.

Technology:

* Three.js
* Web Application

The city acts as a personal environmental digital twin.

---

# Core Visualization Concept

The city changes according to the user's monthly carbon score.

The city does not attempt to be a scientifically accurate climate simulator.

Instead, it uses a simplified degradation model to visualize environmental impact.

---

# Carbon Engine

User Activities

↓

Carbon Calculation

↓

Monthly Carbon Score (calculation possible using the mobile app cus it tracks data)

Range:

0 - 100

Example:

Low impact lifestyle → 20

Average lifestyle → 50

High impact lifestyle → 80

---

# Degradation Model

The carbon score is broken into environmental factors using weighted calculations.

Example:

Carbon Score = 80

Heat Index = 80 × 0.50 = 40

Vegetation Loss = 80 × 0.25 = 20

Air Quality Loss = 80 × 0.15 = 12

Water Quality Loss = 80 × 0.10 = 8

These weights are configurable.

---

# Environmental Variables

The simulation tracks:

* Heat Index
* Tree Density
* Air Quality

# City Generation Logic

Environmental variables modify city characteristics.

Heat Index:

* Ground color
* Sky color

Tree Density:

* Number of trees

Air Quality:

* Fog
* Atmospheric haze

# Data Flow

Transportation Data
+
Food Data

↓

Carbon Engine

↓

Carbon Score

↓

Degradation Model

↓

Environmental Variables

↓

City Generator

↓

Three.js Renderer

↓

3D City

---

# Current Development Scope

The project is currently being developed locally.

Included:

* Three.js
* Vite
* Plain JavaScript

Excluded:

* Firebase
* Databases
* Authentication
* Azure
* Mobile implementation
* Push notifications
* Machine learning
* Production deployment

These features may be added later.

---

# Development Roadmap

Phase 1

* Render cube

Phase 2

* Render ground plane
* Generate buildings

Phase 3

* Generate trees

Phase 4

* Create city generator

Phase 5

* Add environmental variables

Phase 6

* Add degradation model

Phase 7

* Connect carbon score to city state

Phase 8

* Add UI controls

Phase 9

* Integrate tracking system

---

# AI Development Rules

1. Explain architecture before implementation.

2. Do not install new libraries without approval.

3. Keep code beginner-friendly.

4. Prefer simple solutions.

5. Avoid unnecessary abstractions.

6. Avoid over-engineering.

7. Do not introduce React, Firebase, databases or backend services unless explicitly requested.

8. Current approved libraries:

   * Three.js
   * Vite

9. Every new file must have a clear purpose.

10. Favor readability over optimization.

---

# Success Criteria

A user can:

1. Enter or generate a carbon score.
2. Observe environmental variables change.
3. See a 3D city evolve accordingly.
4. Understand the environmental impact of lifestyle choices through visual feedback.
