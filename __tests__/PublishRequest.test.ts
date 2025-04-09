import { PublishRequest, AWS_APPSYNC_EVENTS_SUBPROTOCOL, DEFAULT_HEADERS } from '../src/index'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { SignatureV4 } from '@smithy/signature-v4'

// Mock dependencies
jest.mock('@aws-sdk/credential-providers', () => ({
  fromNodeProviderChain: jest.fn(),
}))

jest.mock('@smithy/signature-v4', () => ({
  SignatureV4: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockImplementation((request) => ({
      ...request,
      headers: {
        ...request.headers,
        'x-amz-signature': 'mock-signature',
        authorization: 'AWS4-HMAC-SHA256 mock-signature',
      },
    })),
  })),
}))

// Mock crypto.randomUUID
const mockUUID = '00000000-0000-0000-0000-000000000000'
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn().mockReturnValue(mockUUID),
}

describe('PublishRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()

      // Setup mock credentials
      ; (fromNodeProviderChain as jest.Mock).mockReturnValue({
        accessKeyId: 'mock-access-key',
        secretAccessKey: 'mock-secret-key',
      })
  })

  describe('Constants', () => {
    test('AWS_APPSYNC_EVENTS_SUBPROTOCOL should have the correct value', () => {
      expect(AWS_APPSYNC_EVENTS_SUBPROTOCOL).toBe('aws-appsync-event-ws')
    })

    test('DEFAULT_HEADERS should have the correct values', () => {
      expect(DEFAULT_HEADERS).toEqual({
        accept: 'application/json, text/javascript',
        'content-encoding': 'amz-1.0',
        'content-type': 'application/json; charset=UTF-8',
      })
    })
  })

  describe('signed()', () => {
    test('should throw an error if not input is provided', async () => {
      await expect(
        PublishRequest.signed({ region: 'us-east-1' }, 'test-channel', 'hello'),
      ).rejects.toThrow('No input or url provided')
    })

    test('should throw an error when no events are provided', async () => {
      await expect(
        PublishRequest.signed('https://api.example.com/event', 'test-channel'),
      ).rejects.toThrow('The number of events to publish must be between 1 and 5')
    })

    test('should throw an error when more than 5 events are provided', async () => {
      await expect(
        PublishRequest.signed('https://api.example.com/event', 'test-channel', 1, 2, 3, 4, 5, 6),
      ).rejects.toThrow('The number of events to publish must be between 1 and 5')
    })

    test('should throw an error when region is not provided for a custom domain', async () => {
      await expect(
        PublishRequest.signed({ url: 'https://custom-domain.com/event' }, 'test-channel', {
          data: 'test',
        }),
      ).rejects.toThrow('Region not provided and not found in input url')
    })

    test('should create a signed request with a string domain input', async () => {
      const domain = 'api-id.appsync-api.us-east-1.amazonaws.com'
      const channel = 'test-channel'
      const event = { message: 'Hello, world!' }

      const request = await PublishRequest.signed(`https://${domain}/event`, channel, event)

      // Check that the SignatureV4 constructor was called with correct parameters
      expect(SignatureV4).toHaveBeenCalledWith({
        credentials: expect.any(Object),
        service: 'appsync',
        region: 'us-east-1',
        sha256: expect.any(Function),
      })

      // Check the request properties
      expect(request).toBeInstanceOf(PublishRequest)
      expect(request.method).toBe('POST')
      expect(request.channel).toBe(channel)
      expect(request.events).toEqual([event])

      // Verify request body was prepared correctly
      const requestHeaders = Object.fromEntries(request.headers.entries())
      expect(requestHeaders).toMatchObject({
        'x-amz-signature': 'mock-signature',
        authorization: 'AWS4-HMAC-SHA256 mock-signature',
      })
    })

    test('should create a signed request with a custom domain and region', async () => {
      const config = {
        url: 'https://custom-api.example.com/event',
        region: 'eu-west-1',
      }
      const channel = 'test-channel'
      const event = { message: 'Hello, world!' }

      const request = await PublishRequest.signed(config, channel, event)

      // Check that the SignatureV4 constructor was called with correct parameters
      expect(SignatureV4).toHaveBeenCalledWith({
        credentials: expect.any(Object),
        service: 'appsync',
        region: 'eu-west-1',
        sha256: expect.any(Function),
      })

      // Check the request properties
      expect(request).toBeInstanceOf(PublishRequest)
      expect(request.channel).toBe(channel)
      expect(request.events).toEqual([event])
    })

    test('should handle multiple events correctly', async () => {
      const domain = 'api-id.appsync-api.us-east-1.amazonaws.com'
      const channel = 'test-channel'
      const events = [{ message: 'Hello' }, { message: 'World' }, { message: '!' }]

      const request = await PublishRequest.signed(`https://${domain}/event`, channel, ...events)

      expect(request.events).toEqual(events)
    })
  })
})
