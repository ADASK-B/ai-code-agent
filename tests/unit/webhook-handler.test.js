import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import supertest from 'supertest';
import express from 'express';
import { WebhookHandler } from '../../services/gateway/src/handlers/webhook-handler.js';
import { adoPullRequestCommentEvent, editCommands } from '../fixtures/ado-webhook-fixtures.js';

/**
 * Unit Tests for Webhook Handler
 * 
 * Tests the core webhook processing logic in isolation
 */
describe('WebhookHandler', () => {
  let app;
  let request;
  let webhookHandler;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    webhookHandler = new WebhookHandler();
    
    // Mount webhook handler routes
    app.post('/webhooks/ado', webhookHandler.handleAdoWebhook.bind(webhookHandler));
    
    request = supertest(app);
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Azure DevOps Webhook Processing', () => {
    it('should extract edit command from PR comment', () => {
      const comment = '/edit /2 Add Hello World to README';
      const result = webhookHandler.parseEditCommand(comment);
      
      expect(result).to.deep.equal({
        isValid: true,
        variants: 2,
        intent: 'Add Hello World to README'
      });
    });

    it('should reject invalid edit commands', () => {
      editCommands.invalid.forEach(command => {
        const result = webhookHandler.parseEditCommand(command);
        expect(result.isValid).to.be.false;
      });
    });

    it('should validate variant count range', () => {
      const tooFew = webhookHandler.parseEditCommand('/edit /0 Test');
      expect(tooFew.isValid).to.be.false;
      
      const tooMany = webhookHandler.parseEditCommand('/edit /11 Test');
      expect(tooMany.isValid).to.be.false;
      
      const justRight = webhookHandler.parseEditCommand('/edit /5 Test');
      expect(justRight.isValid).to.be.true;
      expect(justRight.variants).to.equal(5);
    });

    it('should validate intent length', () => {
      const tooShort = webhookHandler.parseEditCommand('/edit /2 Hi');
      expect(tooShort.isValid).to.be.false;
      
      const tooLong = webhookHandler.parseEditCommand('/edit /2 ' + 'x'.repeat(201));
      expect(tooLong.isValid).to.be.false;
      
      const justRight = webhookHandler.parseEditCommand('/edit /2 Perfect length intent');
      expect(justRight.isValid).to.be.true;
    });
  });

  describe('Payload Generation', () => {
    it('should generate valid orchestrator payload', () => {
      const payload = webhookHandler.generateOrchestratorPayload(
        adoPullRequestCommentEvent,
        'Add dark mode support',
        3
      );

      expect(payload).to.have.property('repoUrn');
      expect(payload).to.have.property('prId', 3);
      expect(payload).to.have.property('intent', 'Add dark mode support');
      expect(payload).to.have.property('variantsRequested', 3);
      expect(payload).to.have.property('correlationId');
      expect(payload).to.have.property('idempotencyKey');
    });

    it('should generate unique correlation IDs', () => {
      const payload1 = webhookHandler.generateOrchestratorPayload(
        adoPullRequestCommentEvent, 'Test 1', 1
      );
      const payload2 = webhookHandler.generateOrchestratorPayload(
        adoPullRequestCommentEvent, 'Test 2', 1
      );

      expect(payload1.correlationId).to.not.equal(payload2.correlationId);
    });
  });

  describe('HTTP Endpoint', () => {
    it('should accept valid ADO webhook', async () => {
      const response = await request
        .post('/webhooks/ado')
        .send(adoPullRequestCommentEvent)
        .expect(200);

      expect(response.body).to.have.property('status', 'accepted');
      expect(response.body).to.have.property('jobId');
    });

    it('should reject webhook without comment', async () => {
      const invalidPayload = {
        ...adoPullRequestCommentEvent,
        resource: {
          ...adoPullRequestCommentEvent.resource,
          comment: undefined
        }
      };

      await request
        .post('/webhooks/ado')
        .send(invalidPayload)
        .expect(400);
    });

    it('should reject webhook with invalid edit command', async () => {
      const invalidPayload = {
        ...adoPullRequestCommentEvent,
        resource: {
          ...adoPullRequestCommentEvent.resource,
          comment: {
            ...adoPullRequestCommentEvent.resource.comment,
            content: 'Just a regular comment'
          }
        }
      };

      const response = await request
        .post('/webhooks/ado')
        .send(invalidPayload)
        .expect(200);

      expect(response.body).to.have.property('status', 'ignored');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      await request
        .post('/webhooks/ado')
        .send('invalid json')
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request
        .post('/webhooks/ado')
        .send({})
        .expect(400);
    });
  });
});
