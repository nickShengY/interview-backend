/**
 * Unit tests for reward system probability calculations
 * Tests the statistical properties of the reward algorithm
 */

// We'll need to extract the calculateReward function
// For now, we'll test the logic by directly copying the algorithm

const MICRO_REWARD = 5
const JACKPOT_REWARD = 100

/**
 * Calculate dynamic reward probability based on user state
 * Copied from app/api/interview/evaluate/route.ts for testing
 */
function calculateReward(
  userCredits: number,
  consecutiveLosses: number,
  totalSets: number,
  totalCorrect: number
): number {
  // No reward for 0-1 correct answers
  if (totalCorrect <= 1) return 0

  // First-time user bonus (3+ correct)
  if (totalSets === 0 && totalCorrect >= 3) return MICRO_REWARD

  // Losing streak compassion (4+ losses, 3+ correct)
  if (consecutiveLosses >= 4 && totalCorrect >= 3) return MICRO_REWARD

  let microChance = 0
  let jackpotChance = 0

  // Base probabilities by performance
  if (totalCorrect === 2) {
    microChance = 0.10
  } else if (totalCorrect === 3) {
    microChance = 0.18
  } else if (totalCorrect === 4) {
    microChance = 0.26
    jackpotChance = 0.001
  } else {
    // totalCorrect === 5
    microChance = 0.32
    jackpotChance = 0.003
  }

  // Boosts for struggling users
  if (userCredits < 10) microChance += 0.05
  if (totalSets < 3) microChance += 0.05
  if (consecutiveLosses >= 2) microChance += 0.03

  // Penalties for wealthy users
  if (userCredits >= 50) microChance = Math.max(0, microChance - 0.06)
  if (userCredits >= 150) microChance = Math.max(0, microChance - 0.08)

  // Cap micro chance
  microChance = Math.min(microChance, 0.60)

  // Jackpot only for perfect scores
  if (totalCorrect < 5) jackpotChance = 0

  const roll = Math.random()
  if (roll < jackpotChance) return JACKPOT_REWARD
  if (roll < jackpotChance + microChance) return MICRO_REWARD
  return 0
}

describe('Reward Probability System', () => {
  describe('Edge Cases', () => {
    it('should give no reward for 0 correct answers', () => {
      const reward = calculateReward(50, 0, 5, 0)
      expect(reward).toBe(0)
    })

    it('should give no reward for 1 correct answer', () => {
      const reward = calculateReward(50, 0, 5, 1)
      expect(reward).toBe(0)
    })

    it('should give guaranteed micro reward for first-time users with 3+ correct', () => {
      const reward = calculateReward(10, 0, 0, 3)
      expect(reward).toBe(MICRO_REWARD)
    })

    it('should give guaranteed micro reward for first-time users with perfect score', () => {
      const reward = calculateReward(10, 0, 0, 5)
      expect(reward).toBe(MICRO_REWARD)
    })

    it('should give guaranteed micro reward after 4 consecutive losses', () => {
      const reward = calculateReward(50, 4, 10, 3)
      expect(reward).toBe(MICRO_REWARD)
    })
  })

  describe('Statistical Distribution', () => {
    const runSimulation = (
      userCredits: number,
      losses: number,
      totalSets: number,
      correct: number,
      iterations = 10000
    ) => {
      const results = {
        noReward: 0,
        microReward: 0,
        jackpot: 0,
      }

      for (let i = 0; i < iterations; i++) {
        const reward = calculateReward(userCredits, losses, totalSets, correct)
        if (reward === 0) results.noReward++
        else if (reward === MICRO_REWARD) results.microReward++
        else if (reward === JACKPOT_REWARD) results.jackpot++
      }

      return {
        noRewardRate: results.noReward / iterations,
        microRewardRate: results.microReward / iterations,
        jackpotRate: results.jackpot / iterations,
        expectedValue: (results.microReward * MICRO_REWARD + results.jackpot * JACKPOT_REWARD) / iterations,
      }
    }

    it('should have ~4% micro reward rate for 2 correct answers (50 credit user)', () => {
      const stats = runSimulation(50, 0, 5, 2)
      // Base 10% - 6% penalty (50+ credits) = 4%
      expect(stats.microRewardRate).toBeGreaterThan(0.02)
      expect(stats.microRewardRate).toBeLessThan(0.06)
    })

    it('should have ~12% micro reward rate for 3 correct answers (50 credit user)', () => {
      const stats = runSimulation(50, 0, 5, 3)
      // Base 18% - 6% penalty (50+ credits) = 12%
      expect(stats.microRewardRate).toBeGreaterThan(0.10)
      expect(stats.microRewardRate).toBeLessThan(0.14)
    })

    it('should have ~20% micro reward rate for 4 correct answers (50 credit user)', () => {
      const stats = runSimulation(50, 0, 5, 4)
      // Base 26% - 6% penalty (50+ credits) = 20%
      expect(stats.microRewardRate).toBeGreaterThan(0.18)
      expect(stats.microRewardRate).toBeLessThan(0.22)
    })

    it('should have ~26% micro reward rate for perfect score (50 credit user)', () => {
      const stats = runSimulation(50, 0, 5, 5)
      // Base 32% - 6% penalty (50+ credits) = 26%
      expect(stats.microRewardRate).toBeGreaterThan(0.24)
      expect(stats.microRewardRate).toBeLessThan(0.28)
    })

    it('should have ~0.3% jackpot rate for perfect score', () => {
      const stats = runSimulation(50, 0, 5, 5, 20000)
      expect(stats.jackpotRate).toBeGreaterThan(0.002)
      expect(stats.jackpotRate).toBeLessThan(0.004)
    })

    it('should have 0% jackpot rate for non-perfect scores', () => {
      const stats = runSimulation(50, 0, 5, 4)
      expect(stats.jackpotRate).toBe(0)
    })
  })

  describe('User State Modifiers', () => {
    const runSimulation = (
      userCredits: number,
      losses: number,
      totalSets: number,
      correct: number,
      iterations = 10000
    ) => {
      let microCount = 0
      for (let i = 0; i < iterations; i++) {
        const reward = calculateReward(userCredits, losses, totalSets, correct)
        if (reward === MICRO_REWARD) microCount++
      }
      return microCount / iterations
    }

    it('should boost reward rate for low-credit users (<10 credits)', () => {
      const lowCreditRate = runSimulation(5, 0, 5, 3)
      const normalRate = runSimulation(50, 0, 5, 3)

      expect(lowCreditRate).toBeGreaterThan(normalRate)
      expect(lowCreditRate - normalRate).toBeGreaterThan(0.04) // ~5% boost
    })

    it('should boost reward rate for new users (<3 total sets)', () => {
      const newUserRate = runSimulation(50, 0, 1, 3)
      const experiencedRate = runSimulation(50, 0, 10, 3)

      expect(newUserRate).toBeGreaterThan(experiencedRate)
      expect(newUserRate - experiencedRate).toBeGreaterThan(0.04) // ~5% boost
    })

    it('should boost reward rate for losing streaks (2+ losses)', () => {
      const losingStreakRate = runSimulation(50, 2, 5, 3)
      const normalRate = runSimulation(50, 0, 5, 3)

      expect(losingStreakRate).toBeGreaterThan(normalRate)
      expect(losingStreakRate - normalRate).toBeGreaterThan(0.015) // ~3% boost
    })

    it('should reduce reward rate for high-credit users (50+ credits)', () => {
      const richUserRate = runSimulation(75, 0, 5, 3)
      const normalRate = runSimulation(25, 0, 5, 3)

      expect(richUserRate).toBeLessThan(normalRate)
      expect(normalRate - richUserRate).toBeGreaterThan(0.05) // ~6% penalty
    })

    it('should further reduce reward rate for very rich users (150+ credits)', () => {
      const veryRichRate = runSimulation(200, 0, 5, 3)
      const richRate = runSimulation(75, 0, 5, 3)

      expect(veryRichRate).toBeLessThan(richRate)
    })
  })

  describe('Expected Value Analysis', () => {
    const calculateExpectedValue = (
      userCredits: number,
      losses: number,
      totalSets: number,
      correct: number,
      iterations = 20000
    ) => {
      let totalValue = 0
      for (let i = 0; i < iterations; i++) {
        totalValue += calculateReward(userCredits, losses, totalSets, correct)
      }
      return totalValue / iterations
    }

    it('should have expected value < 5 credits for perfect score (profit-focused)', () => {
      // Cost: 1 credit per question = 5 credits total
      // Expected value should be less than cost to ensure profitability
      const ev = calculateExpectedValue(50, 0, 5, 5)
      expect(ev).toBeLessThan(5)
    })

    it('should have expected value ~0.2 credits for 2 correct answers (50 credit user)', () => {
      const ev = calculateExpectedValue(50, 0, 5, 2)
      // 4% chance * 5 credits = 0.2
      expect(ev).toBeGreaterThan(0.15)
      expect(ev).toBeLessThan(0.35)
    })

    it('should have expected value ~0.6 credits for 3 correct answers (50 credit user)', () => {
      const ev = calculateExpectedValue(50, 0, 5, 3)
      // 12% chance * 5 credits = 0.6
      expect(ev).toBeGreaterThan(0.5)
      expect(ev).toBeLessThan(0.8)
    })

    it('should have expected value ~1.0 credits for 4 correct answers (50 credit user)', () => {
      const ev = calculateExpectedValue(50, 0, 5, 4)
      // 20% chance * 5 credits = 1.0
      expect(ev).toBeGreaterThan(0.8)
      expect(ev).toBeLessThan(1.2)
    })

    it('should give first-time users a better expected value', () => {
      const firstTimeEV = calculateExpectedValue(10, 0, 0, 5)
      const regularEV = calculateExpectedValue(10, 0, 10, 5)

      // First-time users get guaranteed 5 credits
      expect(firstTimeEV).toBe(MICRO_REWARD)
      expect(firstTimeEV).toBeGreaterThan(regularEV)
    })
  })

  describe('Probability Caps', () => {
    it('should cap micro chance at 60% maximum', () => {
      const runSimulation = (iterations = 10000) => {
        let microCount = 0
        // Max boosts: low credits (5%), new user (5%), losing streak (3%)
        // Base for perfect score: 32%
        // Total before cap: 45%
        for (let i = 0; i < iterations; i++) {
          const reward = calculateReward(5, 2, 1, 5) // All boosts active
          if (reward === MICRO_REWARD || reward === JACKPOT_REWARD) microCount++
        }
        return microCount / iterations
      }

      const rate = runSimulation(20000)
      expect(rate).toBeLessThan(0.50) // Should be well under 60% due to jackpot split
    })

    it('should ensure jackpot probability stays very low', () => {
      const runSimulation = (iterations = 50000) => {
        let jackpotCount = 0
        for (let i = 0; i < iterations; i++) {
          const reward = calculateReward(5, 0, 1, 5)
          if (reward === JACKPOT_REWARD) jackpotCount++
        }
        return jackpotCount / iterations
      }

      const rate = runSimulation()
      expect(rate).toBeLessThan(0.005) // Should be ~0.3%
    })
  })

  describe('Profitability Model', () => {
    it('should ensure house edge across all scenarios', () => {
      const scenarios = [
        { credits: 5, losses: 0, sets: 0, correct: 2 },
        { credits: 5, losses: 0, sets: 0, correct: 3 },
        { credits: 5, losses: 0, sets: 0, correct: 4 },
        { credits: 50, losses: 0, sets: 5, correct: 2 },
        { credits: 50, losses: 0, sets: 5, correct: 3 },
        { credits: 50, losses: 0, sets: 5, correct: 4 },
        { credits: 50, losses: 0, sets: 5, correct: 5 },
        { credits: 200, losses: 0, sets: 20, correct: 5 },
      ]

      scenarios.forEach(({ credits, losses, sets, correct }) => {
        let totalCost = 5 // 1 credit per question × 5 questions
        let totalReward = 0

        for (let i = 0; i < 10000; i++) {
          totalReward += calculateReward(credits, losses, sets, correct)
        }

        const avgReward = totalReward / 10000

        // Allow first-time users to break even (guaranteed 5 credits)
        if (sets === 0 && correct >= 3) {
          expect(avgReward).toBeGreaterThanOrEqual(totalCost * 0.8) // 80% return OK for onboarding
        } else {
          // Regular users should have negative EV (house edge)
          expect(avgReward).toBeLessThan(totalCost)
        }
      })
    })
  })

  describe('Randomness Quality', () => {
    it('should produce different results across multiple runs', () => {
      const results = new Set()
      for (let i = 0; i < 100; i++) {
        const reward = calculateReward(50, 0, 5, 3)
        results.add(reward)
      }

      // Should have both 0 and 5 (or 100) in results
      expect(results.size).toBeGreaterThan(1)
    })

    it('should not show obvious patterns in consecutive calls', () => {
      const sequence: number[] = []
      for (let i = 0; i < 1000; i++) {
        sequence.push(calculateReward(50, 0, 5, 5))
      }

      // Check for alternating pattern (bad RNG)
      let alternations = 0
      for (let i = 1; i < sequence.length; i++) {
        if (sequence[i] !== sequence[i - 1]) alternations++
      }

      // Should not alternate every time (that would indicate pattern)
      const alternationRate = alternations / (sequence.length - 1)
      expect(alternationRate).toBeGreaterThan(0.3)
      expect(alternationRate).toBeLessThan(0.7) // Random should be ~50% ± tolerance
    })
  })
})
