export type AuditEntry = {
  stage: string;
  detail: string;
  durationMs?: number;
  timestamp: number;
};

export type AuditTrail = {
  requestId: string;
  entries: AuditEntry[];
  startedAt: number;
  completedAt?: number;
};

export function createAuditTrail(requestId?: string): AuditTrail {
  return {
    requestId: requestId ?? crypto.randomUUID(),
    entries: [],
    startedAt: Date.now(),
  };
}

export function auditRecord(
  trail: AuditTrail,
  stage: string,
  detail: string,
  durationMs?: number,
): void {
  trail.entries.push({ stage, detail, durationMs, timestamp: Date.now() });
}

export function auditFinalize(trail: AuditTrail): AuditTrail {
  trail.completedAt = Date.now();
  return trail;
}
