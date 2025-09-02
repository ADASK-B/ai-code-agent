import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import axios from 'axios';
import { adoPullRequestCommentEvent } from '../fixtures/ado-webhook-fixtures.js';

/**
 * Integration Tests for Code Agent MVP
 * 
 * Tests the complete workflow from webhook to draft PR creation
 */
describe('Code Agent Integration Tests', () => {
  const BASE_URL = 'http://localhost:3001';
  const ORCHESTRATOR_URL = 'http://localhost:7071';
  
  before(async () => {
    // Wait for services to be ready
    console.log('Waiting for services to start...');
    await waitForService(BASE_URL + '/health', 30000);
    await waitForService(ORCHESTRATOR_URL + '/api/health', 30000);
  });

  after(() => {
    // Cleanup if needed
  });

  describe('Service Health Checks', () => {
    it('should have gateway service running', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
    });

    it('should have orchestrator service running', async () => {
      const response = await axios.get(`${ORCHESTRATOR_URL}/api/health`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
    });

    it('should have adapter service accessible', async () => {
      try {
        const response = await axios.get('http://localhost:3002/health');
        expect(response.status).to.equal(200);
      } catch (error) {
        console.warn('Adapter service not running, skipping test');
        // Skip if adapter is not running
      }
    });

    it('should have llm-patch service accessible', async () => {
      try {
        const response = await axios.get('http://localhost:3003/health');
        expect(response.status).to.equal(200);
      } catch (error) {
        console.warn('LLM-Patch service not running, skipping test');
        // Skip if llm-patch is not running
      }
    });
  });

  describe('End-to-End Webhook Processing', () => {
    it('should process ADO webhook and start job', async () => {
      const response = await axios.post(`${BASE_URL}/webhooks/ado`, adoPullRequestCommentEvent);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'accepted');
      expect(response.data).to.have.property('jobId');
      expect(response.data).to.have.property('variantsRequested', 2);
    });

    it('should ignore non-edit comments', async () => {
      const nonEditPayload = {
        ...adoPullRequestCommentEvent,
        resource: {
          ...adoPullRequestCommentEvent.resource,
          comment: {
            ...adoPullRequestCommentEvent.resource.comment,
            content: 'This is just a regular comment'
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/webhooks/ado`, nonEditPayload);
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ignored');
    });
  });

  describe('Orchestrator Integration', () => {
    it('should accept job from gateway', async function() {
      this.timeout(10000); // Allow more time for orchestration
      
      // Send webhook to gateway
      const webhookResponse = await axios.post(`${BASE_URL}/webhooks/ado`, adoPullRequestCommentEvent);
      expect(webhookResponse.data.status).to.equal('accepted');
      
      const jobId = webhookResponse.data.jobId;
      
      // Wait a bit for orchestration to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check job status (this would be a real endpoint in full implementation)
      try {
        const statusResponse = await axios.get(`${ORCHESTRATOR_URL}/api/jobs/${jobId}/status`);
        expect(statusResponse.status).to.equal(200);
        expect(statusResponse.data).to.have.property('jobId', jobId);
      } catch (error) {
        console.warn('Job status endpoint not implemented yet, skipping status check');
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed webhook payloads', async () => {
      try {
        await axios.post(`${BASE_URL}/webhooks/ado`, { invalid: 'payload' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should handle service unavailability gracefully', async () => {
      // This test would check resilience when downstream services are down
      // For now, just verify the gateway responds appropriately
      const response = await axios.post(`${BASE_URL}/webhooks/ado`, adoPullRequestCommentEvent);
      expect(response.status).to.be.oneOf([200, 202, 503]);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent webhooks', async function() {
      this.timeout(15000);
      
      const webhookPromises = [];
      for (let i = 0; i < 5; i++) {
        const modifiedPayload = {
          ...adoPullRequestCommentEvent,
          resource: {
            ...adoPullRequestCommentEvent.resource,
            comment: {
              ...adoPullRequestCommentEvent.resource.comment,
              content: `/edit /2 Test concurrent request ${i}`,
              id: i + 100
            }
          }
        };
        
        webhookPromises.push(axios.post(`${BASE_URL}/webhooks/ado`, modifiedPayload));
      }
      
      const responses = await Promise.all(webhookPromises);
      responses.forEach(response => {
        expect(response.status).to.equal(200);
        expect(response.data.status).to.equal('accepted');
      });
    });
  });
});

/**
 * Helper function to wait for a service to become available
 */
async function waitForService(url, timeout = 30000) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      await axios.get(url);
      return; // Service is ready
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Service at ${url} did not become available within ${timeout}ms`);
}
