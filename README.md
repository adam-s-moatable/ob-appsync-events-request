# AppSync Events Request

A lightweight TypeScript library for signing and publishing events to AWS AppSync Events APIs from Node.js environments (such as AWS Lambda functions).

## Installation

```bash
npm install ob-appsync-events-request
```

## Features

- Create signed requests to publish events to AppSync Events APIs
- Compatible with the Fetch API
- Includes TypeScript types
- Automatic credential resolution from environment
- Support for both standard AppSync domains and custom domains
- Batching of up to 5 events in a single request
- Designed for Node.js environments (AWS Lambda, EC2, etc.)

## Usage

```typescript
import { PublishRequest } from 'ob-appsync-events-request';

// Create a signed request
const request = await PublishRequest.signed(
  {
    channel: 'your-channel-name',
    events: [{ message: 'Hello, world!' }]
  },
  'your-appsync-domain.appsync-api.region.amazonaws.com'
);

// Send the request using fetch
const response = await fetch(request);
const result = await response.json();
console.log(result);
```

### Using with custom domains and IAM auth

```typescript
const request = await PublishRequest.signed(
  {
    channel: 'your-channel-name',
    events: [{ message: 'Hello, world!' }]
  },
  {
    httpDomain: 'your-custom-domain.com',
    region: 'us-east-1' // Region is required for custom domains
  }
);
```

## Documentation

For more information on AppSync Events, refer to the [AWS AppSync Events API documentation](https://docs.aws.amazon.com/appsync/latest/eventapi/event-api-welcome.html).

## License

ISC