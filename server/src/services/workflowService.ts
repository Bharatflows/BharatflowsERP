import prisma from '../config/prisma';
import logger from '../config/logger';

export const workflowService = {
  /**
   * Check if a document requires approval based on defined workflows
   */
  checkApprovalRequired: async (companyId: string, documentType: string, data: any) => {
    const amount = data.amount || data.totalAmount || 0;

    // Find active workflows for this document type
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: { companyId, documentType, isActive: true },
      include: {
        steps: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!workflow || workflow.steps.length === 0) {
      return { required: false };
    }

    // Evaluate rules
    // For now, we support "Amount" based rules.
    // If ANY step has a condition that matches, the workflow is triggered.
    // Usually, workflows are triggered if the criteria for the *first* step (or any step involved) is met.
    // Let's assume: If amount > 0 and workflow exists, check if amount falls into any step's range.

    const matchingSteps = workflow.steps.filter(step => {
      const min = Number(step.minAmount || 0);
      const max = step.maxAmount ? Number(step.maxAmount) : Infinity;
      return amount >= min && amount <= max;
    });

    if (matchingSteps.length > 0) {
      // Return the full workflow and the first matching step sequence (usually 1, or dynamic based on rules)
      // For sequential workflows, we usually start at Step 1 if the overall conditions are met.
      // But if Step 2 is "Amount > 50k" and Step 1 is "Amount > 10k", a 60k doc needs both? Or just the highest?
      // Standard Sequential Approval: Start at Step 1.
      // Rule-based: Only trigger specific steps.
      // Let's stick to Sequential for MVP: If amount matches workflow criteria, start at Step 1.
      return { required: true, workflowId: workflow.id, startStep: 1 };
    }

    return { required: false };
  },

  /**
   * Initiate an approval request
   */
  initiateApproval: async (companyId: string, documentType: string, documentId: string, requestedBy: string, data: any) => {
    const check = await workflowService.checkApprovalRequired(companyId, documentType, data);

    if (!check.required || !check.workflowId) {
      // Auto-approve if no workflow required? Or just return null (caller handles "Approved" status)
      return { status: 'AUTO_APPROVED' };
    }

    // Create Request
    const request = await prisma.approvalRequest.create({
      data: {
        companyId,
        entityType: documentType,
        entityId: documentId,
        requestedById: requestedBy,
        status: 'PENDING',
        currentStep: check.startStep || 1,
        amount: data.amount || data.totalAmount
      },
    });

    logger.info(`[Workflow] Approval initiated for ${documentType}:${documentId} (Request: ${request.id})`);
    return { status: 'PENDING', requestId: request.id };
  },

  /**
   * Process an approval action (Approve/Reject)
   */
  processApproval: async (requestId: string, action: 'APPROVED' | 'REJECTED', actorId: string, comments?: string) => {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { company: true },
    });

    if (!request) throw new Error('Approval request not found');
    if (request.status !== 'PENDING') throw new Error(`Request is ${request.status}`);

    // Log the action
    await prisma.approvalLog.create({
      data: {
        requestId,
        stepSequence: request.currentStep,
        action,
        actorId,
        comments,
      },
    });

    if (action === 'REJECTED') {
      const updated = await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          comments: comments,
          approvedAt: new Date() // Actually rejectedAt, sharing field for closure time
        },
      });
      return { status: 'REJECTED', request: updated };
    }

    // If APPROVED, check for next step
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: { companyId: request.companyId, documentType: request.entityType, isActive: true },
      include: { steps: { orderBy: { sequence: 'asc' } } }
    });

    if (!workflow) throw new Error('Workflow definition missing during processing');

    // Find next step
    // Logic: Is there a step with sequence > currentStep AND matches the criteria (e.g. amount)?
    // If strict sequential: just next sequence.
    // If conditional steps: check criteria.

    // Simple Sequential:
    const nextSteps = workflow.steps.filter(s => s.sequence > request.currentStep);
    const amount = Number(request.amount || 0);

    const validNextStep = nextSteps.find(step => {
      const min = Number(step.minAmount || 0);
      const max = step.maxAmount ? Number(step.maxAmount) : Infinity;
      return amount >= min && amount <= max;
    });

    if (validNextStep) {
      // Advance to next step
      const updated = await prisma.approvalRequest.update({
        where: { id: requestId },
        data: { currentStep: validNextStep.sequence }
      });
      return { status: 'PENDING_NEXT_STEP', nextStep: validNextStep.sequence, request: updated };
    } else {
      // Workflow Complete
      const updated = await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedById: actorId,
          approvedAt: new Date()
        }
      });
      return { status: 'APPROVED', request: updated };
    }
  },

  /**
   * Get pending requests for an approver
   * @todo Add role-based filtering
   */
  getPendingRequests: async (userId: string, companyId: string) => {
    // MVP: Return all pending requests for the company. 
    // Real: Filter by user.role in [CurrentStep.approverRole]
    return await prisma.approvalRequest.findMany({
      where: {
        companyId,
        status: 'PENDING'
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        logs: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /** 
   * Get workflow definition 
   */
  getWorkflow: async (companyId: string, documentType: string) => {
    return await prisma.approvalWorkflow.findFirst({
      where: { companyId, documentType },
      include: { steps: { orderBy: { sequence: 'asc' } } }
    });
  },

  /**
   * List all workflows for a company
   */
  listWorkflows: async (companyId: string) => {
    return await prisma.approvalWorkflow.findMany({
      where: { companyId },
      include: {
        steps: { orderBy: { sequence: 'asc' } }
      }
    });
  },

  /**
   * Create or Update a workflow
   */
  upsertWorkflow: async (companyId: string, data: any) => {
    const { documentType, isActive, description, steps } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Upsert Header
      const workflow = await tx.approvalWorkflow.upsert({
        where: {
          companyId_documentType: {
            companyId,
            documentType
          }
        },
        update: {
          isActive,
          description
        },
        create: {
          companyId,
          name: documentType,
          documentType,
          isActive,
          description
        }
      });

      // 2. Handle Steps
      await tx.approvalStep.deleteMany({
        where: { workflowId: workflow.id }
      });

      if (steps && steps.length > 0) {
        await tx.approvalStep.createMany({
          data: steps.map((s: any, index: number) => ({
            workflowId: workflow.id,
            sequence: index + 1,
            name: s.name || `Step ${index + 1}`,
            role: s.role,
            approverId: s.approverId,
            minAmount: s.minAmount ? Number(s.minAmount) : 0,
            maxAmount: s.maxAmount ? Number(s.maxAmount) : null
          }))
        });
      }

      return await tx.approvalWorkflow.findUnique({
        where: { id: workflow.id },
        include: { steps: { orderBy: { sequence: 'asc' } } }
      });
    });
  },

  /**
   * Delete a workflow
   */
  deleteWorkflow: async (companyId: string, id: string) => {
    return await prisma.approvalWorkflow.delete({
      where: { id, companyId }
    });
  }
};
