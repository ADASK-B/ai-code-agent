import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyHmacSignature } from '../lib/signature';
import { generateIdempotencyKey, idempotencyStore } from '../lib/idempotency';
import { httpPostWithRetry } from '../lib/http';
import { env } from '../lib/env';

// ADO Webhook Event Schema (simplified for real ADO webhooks)
const adoWebhookSchema = z.object({
  subscriptionId: z.string().optional(),
  notificationId: z.number().optional(),
  id: z.string().optional(),
  eventType: z.string(),
  publisherId: z.string().optional(),
  message: z.object({
    text: z.string(),
    html: z.string().optional(),
    markdown: z.string().optional()
  }).optional(),
  detailedMessage: z.object({
    text: z.string(),
    html: z.string().optional(),
    markdown: z.string().optional()
  }).optional(),
  resource: z.object({
    comment: z.object({
      id: z.number(),
      parentCommentId: z.number().optional(),
      content: z.string(),
      author: z.object({
        displayName: z.string(),
        uniqueName: z.string().optional(),
        id: z.string().optional(),
        url: z.string().optional(),
        imageUrl: z.string().optional(),
        descriptor: z.string().optional(),
        _links: z.any().optional()
      }),
      publishedDate: z.string().optional(),
      lastUpdatedDate: z.string().optional(),
      lastContentUpdatedDate: z.string().optional(),
      commentType: z.string().optional(),
      usersLiked: z.array(z.any()).optional()
    }).optional(),
    pullRequest: z.object({
      pullRequestId: z.number(),
      codeReviewId: z.number().optional(),
      status: z.string().optional(),
      sourceRefName: z.string().optional(),
      targetRefName: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      creationDate: z.string().optional(),
      mergeStatus: z.string().optional(),
      isDraft: z.boolean().optional(),
      repository: z.object({
        id: z.string().optional(),
        name: z.string(),
        url: z.string().optional(),
        project: z.object({
          id: z.string().optional(),
          name: z.string(),
          url: z.string().optional(),
          state: z.string().optional(),
          revision: z.number().optional(),
          visibility: z.string().optional(),
          lastUpdateTime: z.string().optional()
        }).optional(),
        size: z.number().optional(),
        remoteUrl: z.string().optional(),
        sshUrl: z.string().optional(),
        webUrl: z.string().optional(),
        isDisabled: z.boolean().optional(),
        isInMaintenance: z.boolean().optional()
      }).optional(),
      createdBy: z.object({
        displayName: z.string().optional(),
        uniqueName: z.string().optional(),
        id: z.string().optional(),
        url: z.string().optional(),
        imageUrl: z.string().optional(),
        descriptor: z.string().optional(),
        _links: z.any().optional()
      }).optional(),
      reviewers: z.array(z.any()).optional(),
      lastMergeSourceCommit: z.any().optional(),
      lastMergeTargetCommit: z.any().optional(),
      lastMergeCommit: z.any().optional(),
      mergeId: z.string().optional(),
      url: z.string().optional(),
      supportsIterations: z.boolean().optional(),
      artifactId: z.string().optional()
    }).optional()
  }).optional(),
  resourceVersion: z.string().optional(),
  resourceContainers: z.object({
    collection: z.object({
      id: z.string().optional(),
      baseUrl: z.string().optional()
    }).optional(),
    account: z.object({
      id: z.string().optional(),
      baseUrl: z.string().optional()
    }).optional(),
    project: z.object({
      id: z.string().optional(),
      baseUrl: z.string().optional()
    }).optional()
  }).optional(),
  createdDate: z.string().optional()
}).passthrough(); // Allow additional fields

type AdoWebhookEvent = z.infer<typeof adoWebhookSchema>;

/**
 * Parse intent from comment content
 */
function parseIntent(content: string): { variants: number; intent: string } | null {
  // Clean the content (remove newlines and trim, and handle mentions)
  const cleanContent = content.replace(/[\r\n]+/g, ' ').trim();
  
  // Match: @AICodingAgent /edit /N <intent> or /edit /N <intent>
  let match = cleanContent.match(/(?:@\w+\s+)?\/edit\s+\/(\d+)\s+(.+)$/i);
  
  // Also try simpler format: @AICodingAgent /edit <intent> or /edit <intent>
  if (!match) {
    const simpleMatch = cleanContent.match(/(?:@\w+\s+)?\/edit\s*:?\s*(.+)$/i);
    if (simpleMatch) {
      return { variants: 1, intent: simpleMatch[1].trim() };
    }
    return null;
  }

  const variants = parseInt(match[1], 10);
  const intent = match[2].trim();

  // Validation
  if (variants < 1 || variants > 10) {
    throw new Error(`Invalid variant count: ${variants}. Must be between 1 and 10.`);
  }

  if (intent.length < 5) {
    throw new Error(`Intent too short: "${intent}". Must be at least 5 characters.`);
  }

  if (intent.length > 200) {
    throw new Error(`Intent too long: ${intent.length} characters. Must be under 200 characters.`);
  }

  return { variants, intent };
}

/**
 * Main ADO webhook handler
 */
export async function adoWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const correlationId = request.headers['x-corr-id'] as string || request.id;
  
  try {
    // 1. Get request body (Fastify auto-parses JSON)
    const payload = request.body;
    
    // 2. Verify webhook signature (optional for ADO)
    const signature = request.headers['x-hub-signature-256'] as string;
    
    // For signature verification, we need raw body string
    // This is a simplified approach - in production, you'd configure Fastify differently
    if (signature && env.WEBHOOK_SECRET) {
      const rawBody = JSON.stringify(payload);
      if (!verifyHmacSignature(rawBody, signature, env.WEBHOOK_SECRET)) {
        request.log.warn({
          correlationId,
          signature: signature.substring(0, 16) + '...'
        }, 'Invalid webhook signature');
        
        return reply.code(401).send({
          error: 'Invalid signature',
          correlationId
        });
      }
      request.log.debug({ correlationId }, 'Webhook signature verified');
    } else {
      request.log.debug({ correlationId }, 'Webhook signature verification skipped (ADO mode)');
    }

    // 3. Parse webhook payload
    let webhookData: AdoWebhookEvent;
    try {
      webhookData = adoWebhookSchema.parse(payload);
    } catch (error) {
      request.log.error({ error, payload: typeof payload, correlationId }, 'Invalid webhook payload');
      return reply.code(400).send({
        error: 'Invalid payload format',
        details: error instanceof Error ? error.message : `Payload validation failed`,
        correlationId
      });
    }

    // 3. Filter for PR comment events
    if (webhookData.eventType !== 'ms.vss-code.git-pullrequest-comment-event') {
      request.log.debug({
        eventType: webhookData.eventType,
        correlationId
      }, 'Ignoring non-PR-comment event');
      
      return reply.code(200).send({
        message: 'Event ignored',
        eventType: webhookData.eventType,
        correlationId
      });
    }

    // 4. Check if this is a comment event and extract comment data
    if (!webhookData.resource?.comment || !webhookData.resource?.pullRequest) {
      request.log.debug({
        hasComment: !!webhookData.resource?.comment,
        hasPullRequest: !!webhookData.resource?.pullRequest,
        correlationId
      }, 'Not a complete PR comment event');
      
      return reply.code(200).send({
        message: 'Not a complete PR comment event',
        correlationId
      });
    }

    const comment = webhookData.resource.comment;
    const pullRequest = webhookData.resource.pullRequest;

    // 5. Parse intent from comment
    const intentResult = parseIntent(comment.content);
    
    request.log.info({
      originalContent: comment.content,
      cleanedContent: comment.content.replace(/[\r\n]+/g, ' ').trim(),
      intentResult,
      correlationId
    }, 'Parsing comment intent');
    
    if (!intentResult) {
      request.log.info({
        content: comment.content,
        correlationId
      }, 'Comment does not match /edit pattern');
      
      return reply.code(200).send({
        message: 'Comment ignored - not an /edit command',
        correlationId
      });
    }

    // 6. Generate idempotency key
    const org = extractOrgFromUrl(webhookData.resourceContainers?.account?.baseUrl || 'https://dev.azure.com/unknown');
    const project = pullRequest.repository?.project?.name || pullRequest.repository?.name || 'unknown';
    const repo = pullRequest.repository?.name || 'unknown';
    const prId = pullRequest.pullRequestId;
    const commentId = comment.id;

    const idempotencyKey = generateIdempotencyKey(org, project, repo, prId, commentId);

    // 7. Check idempotency
    if (idempotencyStore.has(idempotencyKey)) {
      const existingResult = idempotencyStore.get(idempotencyKey);
      request.log.info({
        idempotencyKey,
        correlationId
      }, 'Duplicate request ignored');
      
      return reply.code(200).send({
        message: 'Request already processed',
        idempotencyKey,
        result: existingResult,
        correlationId
      });
    }

    // 8. Mark as processing
    idempotencyStore.set(idempotencyKey, { status: 'processing' });

    // 9. Prepare orchestrator payload
    const orchestratorPayload = {
      repoUrn: `ado:${org}:${project}:${repo}`,
      prNumber: prId,
      sourceRef: pullRequest.sourceRefName || 'refs/heads/main',
      actor: comment.author.uniqueName || comment.author.displayName,
      intent: intentResult.intent,
      variants: intentResult.variants,
      correlationId: correlationId,
      webhookEvent: webhookData
    };

    request.log.info({
      orchestratorPayload,
      payloadString: JSON.stringify(orchestratorPayload),
      correlationId
    }, 'Triggering orchestrator with detailed payload');

    // 10. Call orchestrator (async)
    try {
      console.log('Sending to orchestrator:', JSON.stringify(orchestratorPayload, null, 2));
      
      const response = await httpPostWithRetry(
        env.ORCHESTRATOR_URL,
        orchestratorPayload,
        {
          correlationId,
          timeout: env.ORCHESTRATOR_TIMEOUT,
          retry: {
            maxAttempts: 2,
            baseDelayMs: 1000
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Orchestrator error response:', errorText);
        request.log.error({
          orchestratorError: errorText,
          status: response.status,
          statusText: response.statusText,
          correlationId
        }, 'Orchestrator returned error');
        throw new Error(`Orchestrator returned ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      idempotencyStore.set(idempotencyKey, result);

      request.log.info({
        result,
        correlationId
      }, 'Orchestrator triggered successfully');

      return reply.code(202).send({
        message: 'Processing started',
        idempotencyKey,
        orchestratorResult: result,
        correlationId
      });

    } catch (error) {
      request.log.error({ error, correlationId }, 'Failed to trigger orchestrator');
      
      // Remove from idempotency store on failure
      idempotencyStore.set(idempotencyKey, { status: 'failed', error: (error as Error).message });
      
      return reply.code(500).send({
        error: 'Failed to start processing',
        details: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      });
    }

  } catch (error) {
    request.log.error({ error, correlationId }, 'Webhook handler error');
    
    return reply.code(500).send({
      error: 'Internal server error',
      correlationId
    });
  }
}

/**
 * Extract organization name from ADO URL
 */
function extractOrgFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // https://dev.azure.com/orgname/ -> orgname
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[0] || 'unknown';
  } catch {
    return 'unknown';
  }
}
