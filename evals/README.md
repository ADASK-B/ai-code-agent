# AI Code Quality Evaluation Framework

## Overview

This directory contains **Golden Tests** for evaluating the quality and consistency of AI-generated code patches. These tests serve as quality gates to ensure the LLM services meet our Service Level Objectives.

## Test Categories

### 1. Intent Recognition Tests
Validate that the system correctly interprets various types of coding requests.

### 2. Code Generation Quality Tests  
Measure the technical quality of generated code patches.

### 3. Provider Comparison Tests
Compare output quality across different LLM providers (OpenAI, Claude, Ollama).

### 4. Edge Case Handling Tests
Ensure graceful handling of unusual or invalid requests.

## Test Structure

```typescript
interface GoldenTest {
  id: string;
  intent: string;
  prMetadata: PrMetadata;
  expectedPatterns: string[];
  forbiddenPatterns: string[];
  confidenceThreshold: number;
  provider?: string;
  tags: string[];
}
```

## Running Tests

```bash
# Run all golden tests
npm run test:golden

# Run specific test category
npm run test:golden -- --category=intent-recognition

# Run provider comparison
npm run test:golden -- --compare-providers

# Generate quality report
npm run test:golden -- --report
```

## Quality Metrics

- **Success Rate**: Percentage of tests passing all criteria
- **Confidence Score**: Average confidence of successful patches  
- **Pattern Match Rate**: How often expected patterns appear in output
- **Consistency Score**: Variance in output quality across providers

## Test Files

- `intent-recognition.json` - Intent parsing and analysis tests
- `code-quality.json` - Code generation quality benchmarks
- `provider-comparison.json` - Cross-provider consistency tests
- `edge-cases.json` - Error handling and boundary condition tests
