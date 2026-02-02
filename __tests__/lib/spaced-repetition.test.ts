/**
 * Unit tests for spaced repetition algorithm (SuperMemo 2)
 * Tests the flashcard scheduling algorithm
 */

/**
 * SuperMemo 2 Algorithm Implementation
 * Based on the SM-2 algorithm for spaced repetition
 */

interface ReviewResult {
  interval: number // Days until next review
  repetitions: number // Number of successful repetitions
  easeFactor: number // Difficulty adjustment (2.5 is neutral)
  nextReview: Date // Calculated next review date
}

/**
 * Calculate next review schedule based on user quality rating
 * @param quality - Rating from 0-5:
 *   0: Complete blackout
 *   1: Incorrect but recognized
 *   2: Incorrect but easy to recall correct answer
 *   3: Correct but difficult
 *   4: Correct with hesitation
 *   5: Perfect recall
 * @param currentInterval - Current interval in days
 * @param currentRepetitions - Number of successful repetitions
 * @param currentEaseFactor - Current ease factor (default 2.5)
 * @returns Updated review schedule
 */
export function calculateNextReview(
  quality: number,
  currentInterval: number = 1,
  currentRepetitions: number = 0,
  currentEaseFactor: number = 2.5
): ReviewResult {
  // Validate quality (0-5)
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5')
  }

  let interval = currentInterval
  let repetitions = currentRepetitions
  let easeFactor = currentEaseFactor

  // Update ease factor based on quality
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  // Minimum ease factor is 1.3
  easeFactor = Math.max(1.3, newEaseFactor)

  // If quality < 3, reset repetitions and start over
  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(currentInterval * easeFactor)
    }
    repetitions += 1
  }

  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)
  nextReview.setHours(0, 0, 0, 0) // Set to start of day

  return {
    interval,
    repetitions,
    easeFactor,
    nextReview,
  }
}

describe('Spaced Repetition Algorithm (SuperMemo 2)', () => {
  describe('Quality Rating Validation', () => {
    it('should accept quality ratings 0-5', () => {
      for (let quality = 0; quality <= 5; quality++) {
        expect(() => calculateNextReview(quality, 1, 0, 2.5)).not.toThrow()
      }
    })

    it('should reject quality ratings < 0', () => {
      expect(() => calculateNextReview(-1, 1, 0, 2.5)).toThrow('Quality must be between 0 and 5')
    })

    it('should reject quality ratings > 5', () => {
      expect(() => calculateNextReview(6, 1, 0, 2.5)).toThrow('Quality must be between 0 and 5')
    })
  })

  describe('First Review (New Card)', () => {
    it('should schedule 1 day interval for quality 3 (correct but difficult)', () => {
      const result = calculateNextReview(3, 1, 0, 2.5)

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
      expect(result.easeFactor).toBeCloseTo(2.36, 2)
    })

    it('should schedule 1 day interval for quality 4 (correct with hesitation)', () => {
      const result = calculateNextReview(4, 1, 0, 2.5)

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
      expect(result.easeFactor).toBeCloseTo(2.5, 2)
    })

    it('should schedule 1 day interval for quality 5 (perfect recall)', () => {
      const result = calculateNextReview(5, 1, 0, 2.5)

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
      expect(result.easeFactor).toBeCloseTo(2.6, 2)
    })

    it('should reset to 1 day for failed recall (quality < 3)', () => {
      const result = calculateNextReview(2, 1, 0, 2.5)

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(0)
      expect(result.easeFactor).toBeCloseTo(2.18, 2)
    })
  })

  describe('Second Review', () => {
    it('should schedule 6 days for quality 3+', () => {
      const result = calculateNextReview(3, 1, 1, 2.36)

      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
    })

    it('should schedule 6 days for quality 5', () => {
      const result = calculateNextReview(5, 1, 1, 2.6)

      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
      expect(result.easeFactor).toBeCloseTo(2.7, 2)
    })

    it('should reset if failed (quality < 3)', () => {
      const result = calculateNextReview(2, 1, 1, 2.5)

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(0)
    })
  })

  describe('Third and Subsequent Reviews', () => {
    it('should use exponential growth based on ease factor', () => {
      // Third review: 6 * 2.5 = 15 days
      const result3 = calculateNextReview(4, 6, 2, 2.5)
      expect(result3.interval).toBe(15)
      expect(result3.repetitions).toBe(3)

      // Fourth review: 15 * 2.5 = 37.5 ≈ 38 days
      const result4 = calculateNextReview(4, 15, 3, 2.5)
      expect(result4.interval).toBeCloseTo(38, 0)
      expect(result4.repetitions).toBe(4)
    })

    it('should increase intervals faster with higher ease factor', () => {
      // Easy card (quality 5, high ease factor)
      const easy = calculateNextReview(5, 6, 2, 2.8)
      expect(easy.interval).toBeGreaterThan(15)

      // Hard card (quality 3, low ease factor)
      const hard = calculateNextReview(3, 6, 2, 2.2)
      expect(hard.interval).toBeLessThan(15)
    })
  })

  describe('Ease Factor Adjustments', () => {
    it('should increase ease factor for perfect recall (quality 5)', () => {
      const result = calculateNextReview(5, 1, 0, 2.5)
      expect(result.easeFactor).toBeGreaterThan(2.5)
    })

    it('should decrease ease factor for difficult recall (quality 3)', () => {
      const result = calculateNextReview(3, 1, 0, 2.5)
      expect(result.easeFactor).toBeLessThan(2.5)
    })

    it('should significantly decrease ease factor for failed recall', () => {
      const result = calculateNextReview(0, 1, 0, 2.5)
      expect(result.easeFactor).toBeLessThan(2.0)
    })

    it('should never go below minimum ease factor of 1.3', () => {
      // Repeatedly fail with quality 0
      let easeFactor = 2.5
      for (let i = 0; i < 20; i++) {
        const result = calculateNextReview(0, 1, 0, easeFactor)
        easeFactor = result.easeFactor
      }
      expect(easeFactor).toBeGreaterThanOrEqual(1.3)
    })
  })

  describe('Realistic Learning Patterns', () => {
    it('should simulate a card learned well over time', () => {
      let interval = 1
      let repetitions = 0
      let easeFactor = 2.5

      // First review: quality 4 (good)
      const r1 = calculateNextReview(4, interval, repetitions, easeFactor)
      expect(r1.interval).toBe(1)
      expect(r1.repetitions).toBe(1)

      // Second review: quality 5 (perfect)
      const r2 = calculateNextReview(5, r1.interval, r1.repetitions, r1.easeFactor)
      expect(r2.interval).toBe(6)
      expect(r2.repetitions).toBe(2)

      // Third review: quality 5 (perfect)
      const r3 = calculateNextReview(5, r2.interval, r2.repetitions, r2.easeFactor)
      expect(r3.interval).toBeGreaterThan(15)
      expect(r3.repetitions).toBe(3)

      // Fourth review: quality 5 (perfect)
      const r4 = calculateNextReview(5, r3.interval, r3.repetitions, r3.easeFactor)
      expect(r4.interval).toBeGreaterThan(40)
      expect(r4.repetitions).toBe(4)

      // Intervals should be exponentially increasing
      expect(r4.interval).toBeGreaterThan(r3.interval)
      expect(r3.interval).toBeGreaterThan(r2.interval)
    })

    it('should simulate a difficult card with mixed results', () => {
      let interval = 1
      let repetitions = 0
      let easeFactor = 2.5

      // First review: quality 3 (hard)
      const r1 = calculateNextReview(3, interval, repetitions, easeFactor)
      expect(r1.repetitions).toBe(1)

      // Second review: quality 2 (failed)
      const r2 = calculateNextReview(2, r1.interval, r1.repetitions, r1.easeFactor)
      expect(r2.interval).toBe(1) // Reset
      expect(r2.repetitions).toBe(0) // Reset

      // Third review: quality 4 (good)
      const r3 = calculateNextReview(4, r2.interval, r2.repetitions, r2.easeFactor)
      expect(r3.interval).toBe(1)
      expect(r3.repetitions).toBe(1)

      // Fourth review: quality 5 (perfect)
      const r4 = calculateNextReview(5, r3.interval, r3.repetitions, r3.easeFactor)
      expect(r4.interval).toBe(6)
      expect(r4.repetitions).toBe(2)

      // Ease factor should be lower than perfect card
      expect(r4.easeFactor).toBeLessThan(2.6)
    })

    it('should handle repeated failures gracefully', () => {
      let interval = 1
      let repetitions = 0
      let easeFactor = 2.5

      // Fail 5 times in a row
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(1, interval, repetitions, easeFactor)
        interval = result.interval
        repetitions = result.repetitions
        easeFactor = result.easeFactor

        // Should always reset to 1 day
        expect(interval).toBe(1)
        expect(repetitions).toBe(0)
      }

      // Ease factor should be low but above minimum
      expect(easeFactor).toBeGreaterThanOrEqual(1.3)
      expect(easeFactor).toBeLessThan(2.0)
    })
  })

  describe('Next Review Date Calculation', () => {
    it('should calculate correct date for 1-day interval', () => {
      const result = calculateNextReview(3, 1, 0, 2.5)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      expect(result.nextReview.getTime()).toBe(tomorrow.getTime())
    })

    it('should calculate correct date for 6-day interval', () => {
      const result = calculateNextReview(4, 1, 1, 2.5)
      const sixDaysLater = new Date()
      sixDaysLater.setDate(sixDaysLater.getDate() + 6)
      sixDaysLater.setHours(0, 0, 0, 0)

      expect(result.nextReview.getTime()).toBe(sixDaysLater.getTime())
    })

    it('should set time to start of day (00:00:00)', () => {
      const result = calculateNextReview(5, 15, 3, 2.7)

      expect(result.nextReview.getHours()).toBe(0)
      expect(result.nextReview.getMinutes()).toBe(0)
      expect(result.nextReview.getSeconds()).toBe(0)
      expect(result.nextReview.getMilliseconds()).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very high repetition counts', () => {
      const result = calculateNextReview(5, 365, 100, 2.8)

      expect(result.repetitions).toBe(101)
      expect(result.interval).toBeGreaterThan(365)
      expect(result.easeFactor).toBeGreaterThan(2.8)
    })

    it('should handle fractional intervals (round correctly)', () => {
      // 6 * 2.55 = 15.3 → should round to 15
      const result = calculateNextReview(4, 6, 2, 2.55)

      expect(Number.isInteger(result.interval)).toBe(true)
      expect(result.interval).toBeCloseTo(15, 0)
    })

    it('should maintain consistency across multiple reviews', () => {
      // Simulate consistent quality 4 ratings
      let interval = 1
      let repetitions = 0
      let easeFactor = 2.5

      const intervals: number[] = []

      for (let i = 0; i < 10; i++) {
        const result = calculateNextReview(4, interval, repetitions, easeFactor)
        interval = result.interval
        repetitions = result.repetitions
        easeFactor = result.easeFactor
        intervals.push(interval)
      }

      // Intervals should be monotonically increasing
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1])
      }
    })
  })

  describe('Performance Characteristics', () => {
    it('should complete calculation in under 1ms', () => {
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        calculateNextReview(Math.floor(Math.random() * 6), 10, 5, 2.5)
      }

      const end = performance.now()
      const avgTime = (end - start) / 1000

      expect(avgTime).toBeLessThan(1) // Average < 1ms per calculation
    })
  })
})
