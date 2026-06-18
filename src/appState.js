/**
 * appState.js - Centralized state manager for the Carbon footprint digital twin.
 * Maintains daily totals, travel history logs, and simulated notifications.
 * Persists data to localStorage.
 */
export class AppState {
  constructor() {
    this.storageKey = 'ecosphere_app_state';
    
    // Default State (Fallback if localStorage is empty)
    this.state = {
      daily: {
        carKm: 20,
        transitKm: 10,
        activeKm: 2,
        foodChoice: 'balanced'
      },
      // Seed initial history logs so pattern detection can be demonstrated immediately
      history: [
        {
          id: 'seed-1',
          routeName: 'Home → College',
          dayOfWeek: 'Monday',
          time: '08:15 AM',
          distance: 12.5,
          duration: 25, // minutes
          avgSpeed: 30, // km/h
          detectedMode: 'Car',
          confirmedMode: 'Car',
          isCongested: false,
          timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000 // 4 days ago
        },
        {
          id: 'seed-2',
          routeName: 'Home → College',
          dayOfWeek: 'Tuesday',
          time: '08:10 AM',
          distance: 12.5,
          duration: 40, // minutes (simulated traffic)
          avgSpeed: 18.75, // km/h
          detectedMode: 'Transit (Bus)', // misclassified due to traffic congestion speed
          confirmedMode: 'Car', // corrected by user
          isCongested: true,
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
        },
        {
          id: 'seed-3',
          routeName: 'Home → College',
          dayOfWeek: 'Wednesday',
          time: '08:20 AM',
          distance: 12.5,
          duration: 22,
          avgSpeed: 34,
          detectedMode: 'Car',
          confirmedMode: 'Car',
          isCongested: false,
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
        },
        {
          id: 'seed-4',
          routeName: 'Home → College',
          dayOfWeek: 'Thursday',
          time: '08:12 AM',
          distance: 12.5,
          duration: 24,
          avgSpeed: 31.25,
          detectedMode: 'Car',
          confirmedMode: 'Car',
          isCongested: false,
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 day ago
        }
      ],
      notifications: [
        {
          id: 'welcome-alert',
          title: 'Welcome to EcoTrack',
          body: 'Your visual digital twin is ready. Start tracking your activities to see your city evolve!',
          type: 'info',
          time: 'Just now',
          read: false
        }
      ],
      patternsAnalyzed: false
    };

    this.load();
  }

  /**
   * Load state from localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.daily && parsed.history) {
          this.state = parsed;
        }
      } else {
        this.save(); // save default seeds
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, using memory defaults:', e);
    }
  }

  /**
   * Save current state to localStorage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to write state to localStorage:', e);
    }
  }

  /**
   * Update daily parameters (used by manual sliders in desktop view)
   */
  updateDaily(car, transit, active, diet) {
    this.state.daily.carKm = Math.max(0, parseFloat(car) || 0);
    this.state.daily.transitKm = Math.max(0, parseFloat(transit) || 0);
    this.state.daily.activeKm = Math.max(0, parseFloat(active) || 0);
    if (diet) this.state.daily.foodChoice = diet;
    this.save();
  }

  /**
   * Logs food choice
   */
  logDiet(choice) {
    this.state.daily.foodChoice = choice;
    this.save();
  }

  /**
   * Add a tracked GPS trip to the history and update daily totals
   */
  addTrip(trip) {
    const newTrip = {
      id: 'trip-' + Date.now(),
      timestamp: Date.now(),
      dayOfWeek: this.getCurrentDayName(),
      time: this.getCurrentTimeString(),
      ...trip
    };

    this.state.history.unshift(newTrip); // add to top of list

    // Add to daily active stats
    const dist = parseFloat(trip.distance) || 0;
    if (trip.confirmedMode === 'Car') {
      this.state.daily.carKm += dist;
    } else if (trip.confirmedMode === 'Transit (Bus)' || trip.confirmedMode === 'Transit') {
      this.state.daily.transitKm += dist;
    } else if (trip.confirmedMode === 'Bicycle' || trip.confirmedMode === 'Walking' || trip.confirmedMode === 'Active') {
      this.state.daily.activeKm += dist;
    }

    // Add notification alert
    this.addNotification({
      title: 'Activity Tracked Successfully',
      body: `Logged ${dist.toFixed(1)} km via ${trip.confirmedMode}.`,
      type: 'success'
    });

    // Reset pattern flag so user can trigger analysis again
    this.state.patternsAnalyzed = false;

    this.save();
  }

  /**
   * Add a notification alert
   */
  addNotification(notif) {
    this.state.notifications.unshift({
      id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 5),
      read: false,
      time: 'Just now',
      ...notif
    });
    this.save();
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead() {
    this.state.notifications.forEach(n => n.read = true);
    this.save();
  }

  /**
   * Clears all history and resets daily inputs
   */
  clearAllData() {
    this.state.daily = {
      carKm: 0,
      transitKm: 0,
      activeKm: 0,
      foodChoice: 'balanced'
    };
    this.state.history = [];
    this.state.notifications = [
      {
        id: 'reset-alert',
        title: 'Data Reset Complete',
        body: 'All local activity tracking and history have been cleared.',
        type: 'info',
        time: 'Just now',
        read: false
      }
    ];
    this.state.patternsAnalyzed = false;
    this.save();
  }

  /**
   * Analyzes history logs to detect repeating travel patterns
   * Specifically handles the 'Home -> College' repeating route
   */
  analyzePatterns() {
    const history = this.state.history;
    if (history.length < 3) {
      return {
        detected: false,
        message: 'Insufficient travel logs to build behavioral patterns. Log at least 3 trips first.'
      };
    }

    // Count occurrences of matching routes
    const routeCounts = {};
    history.forEach(trip => {
      if (!trip.routeName) return;
      const key = trip.routeName.toLowerCase().trim();
      if (!routeCounts[key]) {
        routeCounts[key] = {
          name: trip.routeName,
          count: 0,
          trips: []
        };
      }
      routeCounts[key].count++;
      routeCounts[key].trips.push(trip);
    });

    let detectedPattern = null;
    for (const key in routeCounts) {
      const route = routeCounts[key];
      // Pattern threshold: Route repeated 3 or more times
      if (route.count >= 3) {
        detectedPattern = route;
        break;
      }
    }

    if (detectedPattern) {
      // Check if it's the Home -> College route
      const isCollege = detectedPattern.name.toLowerCase().includes('college');
      
      let alertMsg = '';
      let co2Savings = '';
      
      if (isCollege) {
        alertMsg = 'You usually travel to college around this time. A metro station is available nearby and could reduce emissions.';
        // 12.5 km car trip = 12.5 * 0.21 = 2.6 kg CO2. Metro = 12.5 * 0.05 = 0.6 kg CO2. Savings = 2.0 kg per trip.
        // If repeated 5 times a week, that is 10 kg CO2 saved!
        co2Savings = 'Savings of ~10.0 kg CO2 / week if switched to Metro!';
      } else {
        alertMsg = `Frequent travel detected on route: ${detectedPattern.name}. Consider carpooling or transit alternatives to lower emissions.`;
        co2Savings = 'Savings of up to 45% carbon emissions possible!';
      }

      // Check if this pattern notification already exists to avoid duplication
      const alreadyNotified = this.state.notifications.some(n => n.body.includes(alertMsg));

      if (!alreadyNotified) {
        this.addNotification({
          title: 'Travel Pattern Identified',
          body: alertMsg,
          type: 'warning',
          time: 'Just now'
        });
      }

      this.state.patternsAnalyzed = true;
      this.save();

      return {
        detected: true,
        routeName: detectedPattern.name,
        message: alertMsg,
        savings: co2Savings,
        count: detectedPattern.count
      };
    }

    return {
      detected: false,
      message: 'No significant repeating travel patterns detected yet. Try logging multiple similar trips.'
    };
  }

  // --- Helper Methods ---
  getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  getCurrentTimeString() {
    let hours = new Date().getHours();
    let minutes = new Date().getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = (hours < 10 ? '0' + hours : hours) + ':' + minutes + ' ' + ampm;
    return strTime;
  }
}
