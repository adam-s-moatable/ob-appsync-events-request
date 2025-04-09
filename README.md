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
- Improved error messages for easier troubleshooting

## Usage

```typescript
import { PublishRequest } from "ob-appsync-events-request";

// Create a signed request
const request = await PublishRequest.signed(
  "https://your-appsync-domain.appsync-api.region.amazonaws.com/event",
  "/your/channel/path",
  { message: "Hello, world!" }
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
    url: "https://your-custom-domain.com/event",
    region: "us-east-1", // Region is required for custom domains
  },
  "/your/channel/path",
  { message: "Hello, world!" }
);
```

### Batch publishing (up to 5 events)

```typescript
const request = await PublishRequest.signed(
  "https://your-appsync-domain.appsync-api.region.amazonaws.com/event",
  "/your/channel/path",
  { messageId: 1, content: "First message" },
  { messageId: 2, content: "Second message" },
  { messageId: 3, content: "Third message" }
);
```

## Error Handling

The library provides clear error messages for common issues:

- When no events or more than 5 events are provided: `The number of events to publish must be between 1 and 5`
- When no input URL is provided: `No input or url provided`
- When region is missing for custom domains: `Region not provided and not found in input url`

## Testing

The library includes a comprehensive test suite. To run the tests:

```bash
npm test
```

For development with continuous testing:

```bash
npm run test:watch
```

## Documentation

For more information on AppSync Events, refer to the [AWS AppSync Events API documentation](https://docs.aws.amazon.com/appsync/latest/eventapi/event-api-welcome.html).

## License

ISC

