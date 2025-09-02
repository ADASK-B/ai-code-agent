#!/usr/bin/env node

/**
 * Service Health Check Script
 * 
 * Monitors all Code Agent services and reports their status
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const services = {
  gateway: {
    name: 'Gateway Service',
    url: 'http://localhost:3001/health',
    port: 3001,
    required: true
  },
  orchestrator: {
    name: 'Orchestrator Service',
    url: 'http://localhost:7071/api/health',
    port: 7071,
    required: true
  },
  adapter: {
    name: 'Adapter Service',
    url: 'http://localhost:3002/health',
    port: 3002,
    required: false
  },
  llmPatch: {
    name: 'LLM-Patch Service',
    url: 'http://localhost:3003/health',
    port: 3003,
    required: false
  },
  ngrok: {
    name: 'Ngrok Tunnel',
    url: 'http://localhost:4040/api/tunnels',
    port: 4040,
    required: false
  },
  prometheus: {
    name: 'Prometheus',
    url: 'http://localhost:9090/-/healthy',
    port: 9090,
    required: false
  },
  grafana: {
    name: 'Grafana',
    url: 'http://localhost:3000/api/health',
    port: 3000,
    required: false
  }
};

async function checkServiceHealth(serviceKey, config) {
  const startTime = performance.now();
  
  try {
    const response = await axios.get(config.url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Code-Agent-Health-Check'
      }
    });
    
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      service: serviceKey,
      name: config.name,
      status: 'healthy',
      responseTime,
      httpStatus: response.status,
      url: config.url,
      required: config.required,
      data: response.data
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      service: serviceKey,
      name: config.name,
      status: 'unhealthy',
      responseTime,
      url: config.url,
      required: config.required,
      error: {
        message: error.message,
        code: error.code,
        httpStatus: error.response?.status
      }
    };
  }
}

async function checkAllServices() {
  console.log('🏥 Code Agent Health Check\n');
  console.log('=' .repeat(60));
  
  const results = await Promise.all(
    Object.entries(services).map(([key, config]) => 
      checkServiceHealth(key, config)
    )
  );
  
  let allHealthy = true;
  let requiredServicesDown = false;
  
  results.forEach(result => {
    const icon = result.status === 'healthy' ? '✅' : '❌';
    const required = result.required ? '(required)' : '(optional)';
    
    console.log(`${icon} ${result.name} ${required}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    
    if (result.status === 'healthy') {
      console.log(`   Status: ${result.httpStatus}`);
      if (result.data?.version) {
        console.log(`   Version: ${result.data.version}`);
      }
    } else {
      console.log(`   Error: ${result.error.message}`);
      if (result.error.httpStatus) {
        console.log(`   HTTP Status: ${result.error.httpStatus}`);
      }
      
      if (result.required) {
        requiredServicesDown = true;
      }
      allHealthy = false;
    }
    console.log('');
  });
  
  console.log('=' .repeat(60));
  
  if (allHealthy) {
    console.log('🎉 All services are healthy!');
  } else if (requiredServicesDown) {
    console.log('💥 Critical services are down! System may not function properly.');
  } else {
    console.log('⚠️  Some optional services are down, but core functionality should work.');
  }
  
  return {
    allHealthy,
    requiredServicesDown,
    results
  };
}

async function watchServices() {
  console.log('👀 Starting continuous health monitoring...');
  console.log('Press Ctrl+C to stop\n');
  
  while (true) {
    const timestamp = new Date().toISOString();
    console.log(`\n🕒 Health check at ${timestamp}`);
    
    await checkAllServices();
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

async function checkNgrokTunnels() {
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels');
    
    console.log('🌐 Active Ngrok Tunnels:');
    response.data.tunnels.forEach(tunnel => {
      console.log(`   ${tunnel.name}: ${tunnel.public_url} -> ${tunnel.config.addr}`);
    });
  } catch (error) {
    console.log('❌ Could not fetch ngrok tunnel information');
  }
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0] || 'check';

switch (command) {
  case 'watch':
    watchServices().catch(console.error);
    break;
  
  case 'tunnels':
    checkNgrokTunnels().catch(console.error);
    break;
  
  case 'check':
  default:
    checkAllServices()
      .then(result => {
        process.exit(result.requiredServicesDown ? 1 : 0);
      })
      .catch(error => {
        console.error('Health check failed:', error);
        process.exit(1);
      });
    break;
}

export { checkAllServices, checkServiceHealth, watchServices };
