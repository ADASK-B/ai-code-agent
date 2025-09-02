#!/usr/bin/env node
/**
 * Code Agent MVP - Docker Health Check Service
 * Läuft als eigener Container und überwacht alle anderen Services
 */

const axios = require('axios');
const express = require('express');
const { execSync } = require('child_process');

// Konfiguration
const SERVICES = [
    { name: 'Gateway', url: 'http://agent-gateway:3001/health', container: 'agent-gateway' },
    { name: 'Orchestrator', url: 'http://agent-orchestrator:7071/admin/host/ping', container: 'agent-orchestrator' },
    { name: 'Adapter', url: 'http://agent-adapter:3002/health', container: 'agent-adapter' },
    { name: 'LLM-Patch', url: 'http://agent-llm-patch:3003/health', container: 'agent-llm-patch' },
    { name: 'Traefik', url: 'http://agent-traefik:8080/ping', container: 'agent-traefik' },
    { name: 'Azurite', url: 'http://agent-azurite:10000', container: 'agent-azurite' }
];

const CONFIG = {
    checkInterval: 30000, // 30 Sekunden
    timeout: 5000,        // 5 Sekunden Timeout
    retries: 2,
    port: 8888
};

// Status Tracking
let healthStatus = {
    overall: 'UNKNOWN',
    services: {},
    lastCheck: null,
    checksTotal: 0,
    checksPassed: 0,
    checksFailed: 0
};

// Colors für Console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(level, message, service = '') {
    const timestamp = new Date().toISOString();
    const color = {
        'OK': colors.green,
        'FAIL': colors.red,
        'WARN': colors.yellow,
        'INFO': colors.blue
    }[level] || colors.reset;
    
    const serviceStr = service ? `[${service}] ` : '';
    console.log(`${timestamp} ${color}[${level}]${colors.reset} ${serviceStr}${message}`);
}

// Docker Container Check
async function checkDockerContainer(containerName) {
    try {
        const result = execSync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`, 
            { encoding: 'utf8', timeout: 5000 });
        
        const isRunning = result.trim().includes(containerName);
        return { running: isRunning, error: null };
    } catch (error) {
        return { running: false, error: error.message };
    }
}

// HTTP Health Check
async function checkServiceHealth(service) {
    try {
        const response = await axios.get(service.url, {
            timeout: CONFIG.timeout,
            validateStatus: (status) => status < 500 // 4xx ist OK, 5xx ist FAIL
        });
        
        return {
            healthy: response.status < 400,
            status: response.status,
            responseTime: response.headers['x-response-time'] || 'N/A',
            error: null
        };
    } catch (error) {
        return {
            healthy: false,
            status: error.response?.status || 0,
            responseTime: 'N/A',
            error: error.code || error.message
        };
    }
}

// Einzelnen Service prüfen
async function checkService(service) {
    log('INFO', `Checking ${service.name}...`);
    
    // 1. Container Check
    const containerStatus = await checkDockerContainer(service.container);
    if (!containerStatus.running) {
        healthStatus.services[service.name] = {
            status: 'FAIL',
            container: false,
            health: false,
            error: containerStatus.error || 'Container not running',
            lastCheck: new Date()
        };
        log('FAIL', `Container not running`, service.name);
        return false;
    }
    
    // 2. Health Endpoint Check
    const healthCheck = await checkServiceHealth(service);
    const isHealthy = containerStatus.running && healthCheck.healthy;
    
    healthStatus.services[service.name] = {
        status: isHealthy ? 'OK' : 'FAIL',
        container: containerStatus.running,
        health: healthCheck.healthy,
        httpStatus: healthCheck.status,
        responseTime: healthCheck.responseTime,
        error: healthCheck.error,
        lastCheck: new Date()
    };
    
    if (isHealthy) {
        log('OK', `Service healthy (${healthCheck.status})`, service.name);
        return true;
    } else {
        log('FAIL', `Service unhealthy: ${healthCheck.error || 'HTTP ' + healthCheck.status}`, service.name);
        return false;
    }
}

// Alle Services prüfen
async function runHealthCheck() {
    log('INFO', '🔍 Starting health check...');
    
    const startTime = Date.now();
    let passedChecks = 0;
    
    // Parallel alle Services prüfen
    const checkPromises = SERVICES.map(service => checkService(service));
    const results = await Promise.all(checkPromises);
    
    passedChecks = results.filter(result => result).length;
    const totalChecks = SERVICES.length;
    const duration = Date.now() - startTime;
    
    // Overall Status bestimmen
    let overallStatus;
    if (passedChecks === totalChecks) {
        overallStatus = 'HEALTHY';
    } else if (passedChecks > totalChecks / 2) {
        overallStatus = 'DEGRADED';
    } else {
        overallStatus = 'UNHEALTHY';
    }
    
    // Status aktualisieren
    healthStatus.overall = overallStatus;
    healthStatus.lastCheck = new Date();
    healthStatus.checksTotal = totalChecks;
    healthStatus.checksPassed = passedChecks;
    healthStatus.checksFailed = totalChecks - passedChecks;
    
    // Ergebnis loggen
    const statusColor = {
        'HEALTHY': colors.green,
        'DEGRADED': colors.yellow,
        'UNHEALTHY': colors.red
    }[overallStatus];
    
    log('INFO', `${statusColor}Health Check Complete: ${overallStatus}${colors.reset} (${passedChecks}/${totalChecks} passed, ${duration}ms)`);
    
    return overallStatus === 'HEALTHY';
}

// Express Server für Health API
function startHealthServer() {
    const app = express();
    
    // Health Endpoint
    app.get('/health', (req, res) => {
        const isHealthy = healthStatus.overall === 'HEALTHY';
        res.status(isHealthy ? 200 : 503).json({
            status: healthStatus.overall,
            timestamp: healthStatus.lastCheck,
            services: healthStatus.services,
            summary: {
                total: healthStatus.checksTotal,
                passed: healthStatus.checksPassed,
                failed: healthStatus.checksFailed,
                successRate: healthStatus.checksTotal > 0 ? 
                    Math.round((healthStatus.checksPassed / healthStatus.checksTotal) * 100) : 0
            }
        });
    });
    
    // Status Dashboard (Simple HTML)
    app.get('/', (req, res) => {
        const statusEmoji = {
            'HEALTHY': '✅',
            'DEGRADED': '⚠️',
            'UNHEALTHY': '❌',
            'UNKNOWN': '❓'
        }[healthStatus.overall];
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Code Agent MVP - Health Status</title>
            <meta http-equiv="refresh" content="30">
            <style>
                body { font-family: monospace; margin: 40px; background: #1a1a1a; color: #fff; }
                .status { font-size: 24px; margin: 20px 0; }
                .healthy { color: #00ff00; }
                .degraded { color: #ffaa00; }
                .unhealthy { color: #ff0000; }
                .service { margin: 10px 0; padding: 10px; background: #2a2a2a; border-radius: 4px; }
                .service.ok { border-left: 4px solid #00ff00; }
                .service.fail { border-left: 4px solid #ff0000; }
            </style>
        </head>
        <body>
            <h1>🏥 Code Agent MVP - Health Monitor</h1>
            <div class="status ${healthStatus.overall.toLowerCase()}">
                ${statusEmoji} Overall Status: ${healthStatus.overall}
            </div>
            <p>Last Check: ${healthStatus.lastCheck || 'Never'}</p>
            <p>Success Rate: ${healthStatus.checksTotal > 0 ? Math.round((healthStatus.checksPassed / healthStatus.checksTotal) * 100) : 0}% (${healthStatus.checksPassed}/${healthStatus.checksTotal})</p>
            
            <h2>Services</h2>
            ${Object.entries(healthStatus.services).map(([name, status]) => `
                <div class="service ${status.status.toLowerCase()}">
                    <strong>${name}</strong>: ${status.status === 'OK' ? '✅' : '❌'} ${status.status}
                    <br>Container: ${status.container ? '🟢' : '🔴'} | Health: ${status.health ? '🟢' : '🔴'}
                    ${status.httpStatus ? `| HTTP: ${status.httpStatus}` : ''}
                    ${status.error ? `<br>Error: ${status.error}` : ''}
                </div>
            `).join('')}
            
            <p><small>Auto-refresh every 30 seconds</small></p>
        </body>
        </html>`;
        
        res.send(html);
    });
    
    app.listen(CONFIG.port, '0.0.0.0', () => {
        log('INFO', `🌐 Health monitor server started on port ${CONFIG.port}`);
        log('INFO', `📊 Dashboard: http://localhost:${CONFIG.port}`);
        log('INFO', `🔍 API: http://localhost:${CONFIG.port}/health`);
    });
}

// Watch Mode - Kontinuierliche Überwachung
async function startWatchMode() {
    log('INFO', `👀 Starting watch mode (interval: ${CONFIG.checkInterval/1000}s)`);
    
    // Sofort einmal prüfen
    await runHealthCheck();
    
    // Dann regelmäßig wiederholen
    setInterval(async () => {
        try {
            await runHealthCheck();
        } catch (error) {
            log('FAIL', `Health check failed: ${error.message}`);
        }
    }, CONFIG.checkInterval);
}

// CLI Parameter parsen
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isVerbose = args.includes('--verbose');

// Main Execution
async function main() {
    log('INFO', '🏥 Code Agent MVP - Health Check Service Starting...');
    
    try {
        // Health Server starten
        startHealthServer();
        
        if (isWatch) {
            // Watch Mode
            await startWatchMode();
        } else {
            // Einmaliger Check
            const isHealthy = await runHealthCheck();
            process.exit(isHealthy ? 0 : 1);
        }
    } catch (error) {
        log('FAIL', `Health check service failed: ${error.message}`);
        process.exit(1);
    }
}

// Graceful Shutdown
process.on('SIGTERM', () => {
    log('INFO', '🛑 Health check service shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('INFO', '🛑 Health check service shutting down...');
    process.exit(0);
});

// Start the service
main().catch(error => {
    log('FAIL', `Fatal error: ${error.message}`);
    process.exit(1);
});
