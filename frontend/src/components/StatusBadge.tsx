import React from 'react';
import { Badge } from './ui/Badge.js';
import { RequestStatus, PowerState, JobStatus } from '../types/index.js';

interface StatusBadgeProps {
  status: RequestStatus | PowerState | JobStatus | string;
  type?: 'request' | 'power' | 'job';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    // Request statuses
    case 'PENDING_APPROVAL':
      return <Badge variant="amber" dot>Pending Approval</Badge>;
    case 'APPROVED':
      return <Badge variant="blue" dot>Approved</Badge>;
    case 'PROVISIONING':
      return <Badge variant="purple" dot>Provisioning</Badge>;
    case 'ACTIVE':
      return <Badge variant="green" dot>Active</Badge>;
    case 'REJECTED':
      return <Badge variant="red" dot>Rejected</Badge>;
    case 'FAILED':
      return <Badge variant="red" dot>Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="slate" dot>Cancelled</Badge>;
    case 'DRAFT':
      return <Badge variant="slate" dot>Draft</Badge>;
    case 'DECOMMISSIONED':
      return <Badge variant="slate" dot>Decommissioned</Badge>;

    // Power statuses
    case 'RUNNING':
      return <Badge variant="green" dot>Running</Badge>;
    case 'STOPPED':
      return <Badge variant="slate" dot>Stopped</Badge>;
    case 'TERMINATED':
      return <Badge variant="red" dot>Terminated</Badge>;

    // Job statuses
    case 'QUEUED':
      return <Badge variant="amber" dot>Queued</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="purple" dot>In Progress</Badge>;
    case 'COMPLETED':
      return <Badge variant="green" dot>Completed</Badge>;

    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};
