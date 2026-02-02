import '@testing-library/jest-dom'

// Ensure Web APIs exist before loading undici
const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, TransformStream } = require('stream/web')
const { Blob } = require('buffer')
if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder
if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder
if (!globalThis.ReadableStream) globalThis.ReadableStream = ReadableStream
if (!globalThis.TransformStream) globalThis.TransformStream = TransformStream
if (!globalThis.Blob) globalThis.Blob = Blob
if (process.env.NODE_ENV === 'test') {
  if (!globalThis.MessageChannel) {
    globalThis.MessageChannel = class MessageChannel {
      constructor() {
        this.port1 = { onmessage: null, postMessage() {}, close() {}, start() {} }
        this.port2 = { onmessage: null, postMessage() {}, close() {}, start() {} }
      }
    }
  }
  if (!globalThis.MessagePort) {
    globalThis.MessagePort = class MessagePort {}
  }
} else {
  const { MessageChannel, MessagePort } = require('worker_threads')
  if (!globalThis.MessageChannel) globalThis.MessageChannel = MessageChannel
  if (!globalThis.MessagePort) globalThis.MessagePort = MessagePort
}

// Polyfill fetch APIs for NextRequest usage in tests
const { fetch, Request, Response, Headers } = require('undici')

if (!globalThis.fetch) globalThis.fetch = fetch
if (!globalThis.Request) globalThis.Request = Request
if (!globalThis.Response) globalThis.Response = Response
if (!globalThis.Headers) globalThis.Headers = Headers

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_ATS_API = 'http://localhost:8000'
