import { Sha256 } from '@aws-crypto/sha256-js'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'

/** AppSync Events WebSocket sub-protocol identifier */
export const AWS_APPSYNC_EVENTS_SUBPROTOCOL = 'aws-appsync-event-ws'

/** Default headers required for AppSync Events API requests */
export const DEFAULT_HEADERS = {
  accept: 'application/json, text/javascript',
  'content-encoding': 'amz-1.0',
  'content-type': 'application/json; charset=UTF-8',
}

/**
 * Configuration interface for AppSync Events Publish requests.
 * Extends the standard RequestInit but omits the body property.
 */
interface PublishRequestInit extends Omit<RequestInit, 'body'> {
  input?: string
  /** AWS region (required with IAM auth on custom domains) */
  region?: string
}

/**
 * A specialized Request class for publishing events to AWS AppSync Events APIs.
 * Extends the standard Fetch API Request object with AppSync-specific functionality.
 */
export class PublishRequest<T = any> extends Request {
  /** HTTP method for all publish requests */
  public readonly method = 'POST'

  /**
   * Creates a signed PublishRequest using the environment's AWS credentials.
   * Signs the request with AWS Signature V4 for IAM authentication.
   *
   * @param input - Full AppSync Events API URL (e.g., 'https://api-id.appsync-api.region.amazonaws.com/event')
   *                or request configuration object with input URL
   * @param channel - Channel name to publish events to
   * @param events - List of events (1-5) to publish in a batch
   * @returns A signed request ready to be sent
   */
  static async signed<K = any>(
    input: string | PublishRequestInit,
    channel: string,
    ...events: K[]
  ) {
    if (events.length === 0 || events.length > 5) {
      throw new Error('The number of events to publish must be between 1 and 5')
    }
    const credentials = fromNodeProviderChain()

    let url: URL
    let region: string | undefined
    let restInput: RequestInit
    let restHeaders: RequestInit['headers'] | undefined

    if (typeof input === 'string') {
      url = new URL(input)
      region = undefined
      restInput = {}
      restHeaders = {}
    } else if (input?.input) {
      const { input: _input, headers: _headers, region, ...rest } = input
      url = new URL(_input)
      restInput = rest
      restHeaders = _headers
    } else {
      throw new Error('No input or url provided')
    }

    const match = url.hostname.match(/\w+\.appsync-api\.([\w-]+)\.amazonaws\.com/)
    if (!region && !match) {
      throw new Error('Region not provided')
    }

    region = region ?? (match?.[1] as string)
    const signer = new SignatureV4({
      credentials,
      service: 'appsync',
      region,
      sha256: Sha256,
    })

    const httpRequest = new HttpRequest({
      method: 'POST',
      headers: { ...DEFAULT_HEADERS, host: url.hostname },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        channel,
        events: events.map((e) => JSON.stringify(e)),
      }),
      hostname: url.hostname,
      path: url.pathname,
    })

    const signedReq = await signer.sign(httpRequest)
    return new PublishRequest(
      url.toString(),
      {
        ...restInput,
        ...signedReq,
        headers: { ...restHeaders, ...signedReq.headers },
      },
      channel,
      [...events],
    )
  }

  /**
   * Private constructor for creating PublishRequest instances.
   * Use the static signed() method to create instances.
   *
   * @param input - Request URL
   * @param init - Request initialization options
   * @param channel - Target channel name
   * @param events - Array of events to publish
   */
  private constructor(
    /** Original request URL */
    public readonly input: string,
    /** Request initialization options */
    public readonly init: RequestInit,
    /** Target channel name */
    public readonly channel: string,
    /** Array of events to publish */
    public readonly events: T[],
  ) {
    super(input, init)
  }
}
