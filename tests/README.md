# Code Agent Tests

This directory contains all tests for the Code Agent MVP project, organized in a centralized location as requested.

## 📁 Directory Structure

```
tests/
├── integration/     # End-to-End Integration Tests
├── unit/           # Service-specific Unit Tests  
├── webhook/        # Webhook & API Testing
├── scripts/        # Test Automation & Utilities
├── fixtures/       # Test Data, Mocks & Sample Payloads
└── package.json    # Test dependencies & scripts
```

## 🧪 Test Categories

### Integration Tests (`integration/`)
Complete workflow testing from webhook to draft PR creation:
- `full-workflow.test.js` - End-to-end Azure DevOps workflow
- Service health checks and inter-service communication
- Performance and concurrency testing

### Unit Tests (`unit/`)
Individual component testing in isolation:
- `webhook-handler.test.js` - Webhook processing logic
- Command parsing and validation
- Payload generation and error handling

### Webhook Tests (`webhook/`)
Live webhook testing and debugging:
- `webhook-server.js` - Standalone test server for manual testing
- Real Azure DevOps webhook simulation
- Ngrok tunnel testing

### Scripts (`scripts/`)
Test automation and monitoring utilities:
- `run-tests.js` - Test orchestration script
- `health-check.js` - Service monitoring and health checks
- Support for different test types and environments

### Fixtures (`fixtures/`)
Reusable test data and mock responses:
- `ado-webhook-fixtures.js` - Azure DevOps webhook payloads
- Sample edit commands (valid/invalid)
- Mock service responses

## 🚀 Quick Start

1. **Install test dependencies:**
   ```bash
   cd tests
   npm install
   ```

2. **Check service health:**
   ```bash
   npm run health
   ```

3. **Run all tests:**
   ```bash
   npm test
   ```

## 📋 Available Commands

### Testing Commands
```bash
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:webhook     # Run webhook tests only
```

### Health Monitoring
```bash
npm run health           # Check all services once
npm run health:watch     # Continuous monitoring
npm run health:tunnels   # Show ngrok tunnel status
```

### Development Tools
```bash
npm run webhook:start    # Start webhook test server
```

## 🔧 Prerequisites

**Required Services (must be running):**
- Gateway Service (localhost:3001)
- Orchestrator Service (localhost:7071)

**Optional Services:**
- Adapter Service (localhost:3002)
- LLM-Patch Service (localhost:3003)
- Ngrok Tunnel (localhost:4040)
- Prometheus (localhost:9090)
- Grafana (localhost:3000)

## 🧰 Test Features

### Webhook Testing
- Live webhook server for manual testing
- Azure DevOps payload simulation
- Command parsing validation
- Error scenario testing

### Integration Testing
- Complete workflow validation
- Service health monitoring
- Concurrent request handling
- Error resilience testing

### Unit Testing
- Component isolation testing
- Mock service responses
- Edge case validation
- Performance benchmarking

## 🐛 Debugging

1. **Check service status:**
   ```bash
   npm run health
   ```

2. **Start webhook server for manual testing:**
   ```bash
   npm run webhook:start
   ```

3. **Run specific test with verbose output:**
   ```bash
   npx mocha tests/unit/**/*.test.js --reporter spec
   ```

4. **Monitor services continuously:**
   ```bash
   npm run health:watch
   ```

## 🔄 Adding New Tests

### Unit Tests
```javascript
// tests/unit/your-component.test.js
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Your Component', () => {
  it('should do something', () => {
    // Test logic here
  });
});
```

### Integration Tests
```javascript
// tests/integration/your-workflow.test.js
import axios from 'axios';

describe('Your Workflow', () => {
  it('should test complete flow', async () => {
    const response = await axios.post('http://localhost:3001/api/endpoint', payload);
    expect(response.status).to.equal(200);
  });
});
```

### Test Data
```javascript
// tests/fixtures/your-fixtures.js
export const sampleData = {
  // Your test data here
};
```

This centralized test structure provides comprehensive testing capabilities while keeping all tests organized in one location as requested.
