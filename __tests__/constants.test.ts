import { AWS_APPSYNC_EVENTS_SUBPROTOCOL, DEFAULT_HEADERS } from '../src/index';

describe('Constants', () => {
  test('AWS_APPSYNC_EVENTS_SUBPROTOCOL should have the correct value', () => {
    expect(AWS_APPSYNC_EVENTS_SUBPROTOCOL).toBe('aws-appsync-event-ws');
  });

  test('DEFAULT_HEADERS should have the correct values', () => {
    expect(DEFAULT_HEADERS).toEqual({
      accept: 'application/json, text/javascript',
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=UTF-8',
    });
  });
});