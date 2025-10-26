# Data Privacy Vault - PII Anonymization API with OpenAI Integration

## Overview
This API provides secure PII (Personally Identifiable Information) anonymization services, replacing sensitive data like names, emails, and phone numbers with secure alphanumeric tokens. It also includes secure ChatGPT integration that protects your PII when interacting with OpenAI's API.

## Features
- **PII Detection**: Automatically identifies names, email addresses, and phone numbers
- **Secure Anonymization**: Replaces PII with cryptographically secure alphanumeric tokens
- **Persistent Storage**: MongoDB integration for reliable token-to-original-value mapping
- **Secure ChatGPT**: Safe interaction with OpenAI API while protecting your PII
- **RESTful API**: Simple POST endpoints for anonymization, deanonymization, and secure AI chat
- **Input Validation**: Comprehensive request validation and error handling
- **Security**: Rate limiting, CORS protection, and security headers
- **Auto-expiration**: Token mappings automatically expire after 30 days

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DataPrivacyVault
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.template .env
```

4. **Configure your environment**
Edit the `.env` file with your actual credentials:

```env
# Database Configuration
DB_PASSWORD=your_mongodb_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### POST /anonymize
Anonymizes PII in a text message by replacing names, emails, and phone numbers with prefixed tokens.

**Request:**
```bash
curl -X POST http://localhost:3001/anonymize \
  -H "Content-Type: application/json" \
  -d '{"message":"oferta de trabajo para Pepito Perez con email pepito@gmail.com y teléfono 3211234567"}'
```

**Response:**
```json
{
  "anonymizedMessage": "oferta de trabajo para NAME_e1be92e2b3a5 NAME_bd673df2c8f1 con email EMAIL_8004719c6ea5 y teléfono PHONE_40e83067b9cb"
}
```

### POST /deanonymize
Restores original PII values by replacing tokens with their original values.

**Request:**
```bash
curl -X POST http://localhost:3001/deanonymize \
  -H "Content-Type: application/json" \
  -d '{"anonymizedMessage":"oferta de trabajo para NAME_e1be92e2b3a5 NAME_bd673df2c8f1 con email EMAIL_8004719c6ea5 y teléfono PHONE_40e83067b9cb"}'
```

**Response:**
```json
{
  "message": "oferta de trabajo para Pepito Perez con email pepito@gmail.com y teléfono 3211234567"
}
```

### POST /secureChatGPT
Safely interacts with OpenAI's ChatGPT while protecting your PII. The system anonymizes your prompt, sends it to OpenAI, and then deanonymizes the response.

**Request:**
```bash
curl -X POST http://localhost:3001/secureChatGPT \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hi, my name is John Smith and my email is john.smith@example.com. Can you help me write a professional email?"}'
```

**Response:**
```json
{
  "response": "Hello John Smith! I'd be happy to help you write a professional email. Here's a template you can use...",
  "timestamp": "2025-10-26T03:15:00.000Z"
}
```

### GET /health
Returns the health status of the API and database connection.

**Request:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-26T03:15:00.000Z",
  "service": "Data Privacy Vault - PII Anonymization API",
  "database": "Connected",
  "mappings": {
    "total": 15,
    "byType": [
      {"_id": "NAME", "count": 8},
      {"_id": "EMAIL", "count": 4},
      {"_id": "PHONE", "count": 3}
    ]
  }
}
```

## Environment Variables

Create a `.env` file in the root directory using the `env.template` as a reference:

```bash
cp env.template .env
```

Then edit the `.env` file with your actual credentials:

```env
# Database Configuration
DB_PASSWORD=your_mongodb_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: 
- Replace `your_mongodb_password_here` with your actual MongoDB password
- Replace `your_openai_api_key_here` with your actual OpenAI API key

## Security Features
- **Rate limiting**: 100 requests per 15 minutes per IP
- **CORS protection**: Configurable cross-origin resource sharing
- **Security headers**: Helmet.js for security headers
- **Input validation**: Comprehensive request validation and sanitization
- **PII Protection**: Automatic anonymization before external API calls
- **Token expiration**: Automatic cleanup of old mappings

## Architecture

### Flow Diagram
```
User Request → Validation → Anonymization → External API → Deanonymization → Response
```

### Components
- **Express.js**: Web framework
- **MongoDB**: Persistent storage for token mappings
- **Mongoose**: MongoDB ODM
- **OpenAI API**: AI completion service
- **Joi**: Request validation
- **Helmet**: Security middleware
- **Rate Limiting**: Request throttling

## Testing

### Manual Testing
Use the provided curl commands above to test each endpoint.

### Automated Testing
```bash
npm test
```

### MongoDB Integration Test
```bash
node test-mongodb.js
```

## Error Handling

The API provides comprehensive error handling with detailed error messages:

- **400 Bad Request**: Invalid input data
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server or database errors
- **503 Service Unavailable**: OpenAI API unavailable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the error logs in the console
2. Verify your environment variables are set correctly
3. Ensure MongoDB and OpenAI API are accessible
4. Check the `/health` endpoint for system status