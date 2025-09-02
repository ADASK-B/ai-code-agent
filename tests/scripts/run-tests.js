#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * Orchestrates running different types of tests with proper setup
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const config = {
  testTimeout: 60000,
  integrationTimeout: 120000,
  retries: 2
};

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      cwd: options.cwd || rootDir,
      shell: process.platform === 'win32',
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function checkServices() {
  console.log('\n🔍 Checking service availability...');
  
  const services = [
    { name: 'Gateway', url: 'http://localhost:3001/health' },
    { name: 'Orchestrator', url: 'http://localhost:7071/api/health' },
    { name: 'Adapter', url: 'http://localhost:3002/health' },
    { name: 'LLM-Patch', url: 'http://localhost:3003/health' }
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url);
      if (response.ok) {
        console.log(`✅ ${service.name} is running`);
      } else {
        console.log(`⚠️  ${service.name} returned ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${service.name} is not available`);
    }
  }
}

async function runUnitTests() {
  console.log('\n🧪 Running Unit Tests...');
  
  try {
    await runCommand('npx', [
      'mocha',
      'tests/unit/**/*.test.js',
      '--timeout', config.testTimeout.toString(),
      '--reporter', 'spec',
      '--recursive'
    ]);
    console.log('✅ Unit tests passed');
  } catch (error) {
    console.error('❌ Unit tests failed:', error.message);
    throw error;
  }
}

async function runIntegrationTests() {
  console.log('\n🔗 Running Integration Tests...');
  
  try {
    await runCommand('npx', [
      'mocha',
      'tests/integration/**/*.test.js',
      '--timeout', config.integrationTimeout.toString(),
      '--reporter', 'spec',
      '--recursive'
    ]);
    console.log('✅ Integration tests passed');
  } catch (error) {
    console.error('❌ Integration tests failed:', error.message);
    throw error;
  }
}

async function runWebhookTests() {
  console.log('\n🪝 Running Webhook Tests...');
  
  try {
    await runCommand('node', ['tests/webhook/webhook-server.js'], {
      timeout: 5000
    });
    console.log('✅ Webhook tests passed');
  } catch (error) {
    console.error('❌ Webhook tests failed:', error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Test Suite...');
  
  try {
    await checkServices();
    await runUnitTests();
    await runIntegrationTests();
    await runWebhookTests();
    
    console.log('\n🎉 All tests passed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0] || 'all';

switch (command) {
  case 'unit':
    runUnitTests().catch(err => {
      console.error(err);
      process.exit(1);
    });
    break;
  
  case 'integration':
    runIntegrationTests().catch(err => {
      console.error(err);
      process.exit(1);
    });
    break;
  
  case 'webhook':
    runWebhookTests().catch(err => {
      console.error(err);
      process.exit(1);
    });
    break;
  
  case 'check':
    checkServices().catch(err => {
      console.error(err);
      process.exit(1);
    });
    break;
  
  case 'all':
  default:
    runAllTests();
    break;
}

// Export for programmatic usage
export {
  runUnitTests,
  runIntegrationTests,
  runWebhookTests,
  runAllTests,
  checkServices
};
