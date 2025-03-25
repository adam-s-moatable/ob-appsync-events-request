import { Sha256 } from '@aws-crypto/sha256-js'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'

/** The AppSync Events WebSocket sub-protocol */
export const AWS_APPSYNC_EVENTS_SUBPROTOCOL = 'aws-appsync-event-ws'

/** The default headers to be signed for an HTTP request */
export const DEFAULT_HEADERS = {
  accept: 'application/json, text/javascript',
  'content-encoding': 'amz-1.0',
  'content-type': 'application/json; charset=UTF-8',
}

/** Interface for an AppSync Events Publish Request input */
interface PublishRequestInit extends Omit<RequestInit, 'body'> {
  /** A HTTP domain for an AppSync Events API. */
  httpDomain: string
  /** A region for the AppSync Events API. Required if using IAM auth with a custom domain. */
  region?: string
}

/**
 * A Request object to publish events to an AppSync Events API using the Fetch API.
 */
export class PublishRequest<T = any> extends Request {
  public readonly method = 'POST'

  /**
   * Creates a signed PublishRequest using the environment's AWS credentials.
   * @param request - The channel and list (up to 5) of events to publish.
   * @param input -the AppSync Events HTTP domain or request object containting the HTTP domain and additional configuration options.
   * @returns A signed request.
   */
  static async signed<K = any>(
    input: string | PublishRequestInit,
    /** A channel to publish to. */
    channel: string,
    /** A list of events (up to 5) to publish in a batch. */
    ...events: K[]
  ) {
    if (events.length === 0 || events.length > 5) {
      throw new Error('The number of events to publish must be between 1 and 5')
    }
    const credentials = fromNodeProviderChain()

    let url: URL
    let region: string | undefined
    let restInput: RequestInit
    let restHeaders: HeadersInit | undefined

    if (typeof input === 'string') {
      url = new URL(`https://${input}/event`)
      region = undefined
      restInput = {}
      restHeaders = {}
    } else {
      url = new URL(`https://${input.httpDomain}/event`)
      region = input.region
      const { httpDomain, headers: _headers, region: _region, ...rest } = input
      restInput = rest
      restHeaders = _headers
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

  private constructor(
    public readonly input: string,
    public readonly init: RequestInit,
    public readonly channel: string,
    public readonly events: T[],
  ) {
    super(input, init)
  }
}
