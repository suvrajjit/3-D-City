/**
 * CarbonEngine - Handles calculation of carbon footprint based on daily activity parameters
 * and outputs a normalized Carbon Score (0 - 100).
 */
export class CarbonEngine {
  constructor() {
    // Current input parameters (default to typical average lifestyle)
    this.carKm = 20;         // km traveled by car per day
    this.transitKm = 10;     // km traveled by public transit per day
    this.activeKm = 2;       // km traveled by foot/bike per day
    this.foodChoice = 'balanced'; // 'vegan', 'vegetarian', 'balanced', 'meat-heavy'

    // Emission factors (kg CO2 per unit)
    this.EMISSION_FACTORS = {
      car: 0.21,          // kg CO2 per km
      transit: 0.05,      // kg CO2 per km
      active: 0.0,        // kg CO2 per km
      food: {
        vegan: 1.5,       // kg CO2 per day
        vegetarian: 2.5,  // kg CO2 per day
        balanced: 4.8,    // kg CO2 per day
        'meat-heavy': 8.2  // kg CO2 per day
      }
    };

    // Reference max daily emissions to scale the score to 100
    // E.g., driving 70km by car and eating meat-heavy food = 70 * 0.21 + 8.2 = 22.9 kg CO2
    this.MAX_CO2_LIMIT = 22.0; 
  }

  /**
   * Set transport inputs
   */
  setTransport(carKm, transitKm, activeKm) {
    this.carKm = Math.max(0, parseFloat(carKm) || 0);
    this.transitKm = Math.max(0, parseFloat(transitKm) || 0);
    this.activeKm = Math.max(0, parseFloat(activeKm) || 0);
  }

  /**
   * Set food input
   */
  setFood(choice) {
    if (this.EMISSION_FACTORS.food[choice] !== undefined) {
      this.foodChoice = choice;
    }
  }

  /**
   * Calculates absolute daily CO2 emissions in kg
   */
  calculateDailyEmissions() {
    const transportCO2 = (this.carKm * this.EMISSION_FACTORS.car) + 
                         (this.transitKm * this.EMISSION_FACTORS.transit);
    const foodCO2 = this.EMISSION_FACTORS.food[this.foodChoice];
    return transportCO2 + foodCO2;
  }

  /**
   * Returns a normalized Carbon Score between 0 and 100
   */
  getCarbonScore() {
    const dailyCO2 = this.calculateDailyEmissions();
    // Normalize to 0-100 scale
    const score = (dailyCO2 / this.MAX_CO2_LIMIT) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Get text description of lifestyle based on carbon score
   */
  getLifestyleDescription(score) {
    if (score < 25) return 'Eco-Hero (Minimal Footprint)';
    if (score < 50) return 'Green Citizen (Low Footprint)';
    if (score < 75) return 'Consumer (Average Footprint)';
    return 'Industrialist (High Footprint)';
  }
}
