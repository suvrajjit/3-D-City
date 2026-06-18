/**
 * DegradationModel - Calculates environmental factors from the Carbon Score
 * using configurable weights.
 */
export class DegradationModel {
  constructor() {
    // Default weights specified in SPECS.md
    this.weights = {
      heatIndex: 0.50,
      vegetationLoss: 0.25,
      airQualityLoss: 0.15,
      waterQualityLoss: 0.10
    };
  }

  /**
   * Set custom configuration weights
   */
  setWeights(weights) {
    this.weights = {
      heatIndex: weights.heatIndex !== undefined ? weights.heatIndex : this.weights.heatIndex,
      vegetationLoss: weights.vegetationLoss !== undefined ? weights.vegetationLoss : this.weights.vegetationLoss,
      airQualityLoss: weights.airQualityLoss !== undefined ? weights.airQualityLoss : this.weights.airQualityLoss,
      waterQualityLoss: weights.waterQualityLoss !== undefined ? weights.waterQualityLoss : this.weights.waterQualityLoss
    };
  }

  /**
   * Calculate environmental degradation parameters from a carbon score (0-100)
   * Returns values in percentage/ratios representing degradation.
   */
  calculate(carbonScore) {
    const score = Math.max(0, Math.min(100, carbonScore));
    
    // Calculate raw factor impacts based on weights
    const heatIndex = score * this.weights.heatIndex;            // 0 - 50 max
    const vegetationLoss = score * this.weights.vegetationLoss;    // 0 - 25 max
    const airQualityLoss = score * this.weights.airQualityLoss;    // 0 - 15 max
    const waterQualityLoss = score * this.weights.waterQualityLoss; // 0 - 10 max

    return {
      // 0 = pristine environment, higher = degraded
      heatIndex,
      vegetationLoss,
      airQualityLoss,
      waterQualityLoss,
      
      // Secondary friendly percentages for UI metrics:
      // High score = low environment status
      metrics: {
        heatIndexPct: Math.round((heatIndex / 50) * 100),       // Max heat impact is 50
        vegetationPct: Math.round((1 - vegetationLoss / 25) * 100), // Remaining green cover
        airQualityPct: Math.round((1 - airQualityLoss / 15) * 100), // Remaining air quality
        waterQualityPct: Math.round((1 - waterQualityLoss / 10) * 100) // Remaining water quality
      }
    };
  }
}
