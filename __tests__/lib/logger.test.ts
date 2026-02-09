/**
 * Comprehensive tests for the logger utility
 * Note: In test environment NODE_ENV=test which follows the production (JSON) code path
 */

import { logger } from '@/lib/logger'

describe('Logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('info()', () => {
    it('should log info messages as JSON', () => {
      logger.info('test info message')
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"info"')
      )
    })

    it('should include the message in output', () => {
      logger.info('hello world')
      const call = (console.log as jest.Mock).mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.message).toBe('hello world')
      expect(parsed.level).toBe('info')
    })

    it('should include timestamp', () => {
      logger.info('ts check')
      const call = (console.log as jest.Mock).mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.timestamp).toBeDefined()
      expect(() => new Date(parsed.timestamp)).not.toThrow()
    })

    it('should include data when provided', () => {
      logger.info('with data', { key: 'value' })
      const call = (console.log as jest.Mock).mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.data).toEqual({ key: 'value' })
    })

    it('should handle no data', () => {
      logger.info('no data')
      const call = (console.log as jest.Mock).mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.message).toBe('no data')
    })
  })

  describe('warn()', () => {
    it('should log warn messages', () => {
      logger.warn('test warning')
      const call = (console.log as jest.Mock).mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.level).toBe('warn')
      expect(parsed.message).toBe('test warning')
    })
  })

  describe('error()', () => {
    it('should log error to console.error', () => {
      logger.error('test error')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('"level":"error"')
      )
    })

    it('should include error data', () => {
      logger.error('fail', { code: 500 })
      const call = (console.error as jest.Mock).mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.data).toEqual({ code: 500 })
    })
  })

  describe('debug()', () => {
    it('should log debug messages', () => {
      logger.debug('debug msg')
      const call = (console.log as jest.Mock).mock.calls[0][0]
      const parsed = JSON.parse(call)
      expect(parsed.level).toBe('debug')
    })
  })

  describe('all levels', () => {
    it.each(['info', 'warn', 'error', 'debug'] as const)('should log %s level correctly', (level) => {
      logger[level](`test ${level}`)
      if (level === 'error') {
        expect(console.error).toHaveBeenCalled()
      } else {
        expect(console.log).toHaveBeenCalled()
      }
    })
  })
})
