/**
 * Airpulse Hybrid Cloud Bridge (v2)
 * ─────────────────────────────────
 * Active-Active Failover between NCP and IBM Cloud
 * with health checks, circuit breaker, and automatic failover.
 */

import axios, { AxiosInstance } from 'axios';

// ─── Types ──────────────────────────────────────────────
interface CloudHealth {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: Date;
  consecutiveFailures: number;
}

interface BridgeMetrics {
  ncp: CloudHealth;
  ibm: CloudHealth;
  totalRequests: number;
  failoverCount: number;
  pushAlertCount: number; // Added
}

interface SyncResult {
  success: boolean;
  primary: string;
  primaryId?: string;
  replicaId?: string;
  failoverUsed: boolean;
  latencyMs: number;
}

// ─── Circuit Breaker Config ─────────────────────────────
const CIRCUIT_BREAKER = {
  maxFailures: 3,          // Failures before opening circuit
  resetTimeoutMs: 30_000,  // Time before half-open retry
  healthCheckIntervalMs: 10_000,
  requestTimeoutMs: 5_000,
};

// ─── Bridge Implementation ──────────────────────────────
export class HybridBridge {
  private static instance: HybridBridge; // Added
  private ncpClient: AxiosInstance;
  private ibmClient: AxiosInstance;
  private metrics: BridgeMetrics;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor() {
    this.ncpClient = axios.create({
      baseURL: process.env.NCP_API_URL || 'https://api.ncloud.com/v1',
      timeout: CIRCUIT_BREAKER.requestTimeoutMs,
      headers: { 'X-NCP-Token': process.env.NCP_ACCESS_KEY || '' },
    });

    this.ibmClient = axios.create({
      baseURL: process.env.IBM_API_URL || 'https://api.ibmcloud.com/v1',
      timeout: CIRCUIT_BREAKER.requestTimeoutMs,
      headers: { 'Authorization': `Bearer ${process.env.IBM_IAM_TOKEN || ''}` },
    });

    this.metrics = {
      ncp: { status: 'healthy', latencyMs: 0, lastChecked: new Date(), consecutiveFailures: 0 },
      ibm: { status: 'healthy', latencyMs: 0, lastChecked: new Date(), consecutiveFailures: 0 },
      totalRequests: 0,
      failoverCount: 0,
      pushAlertCount: 0, // Initialized
    };

    if (!HybridBridge.instance) {
      HybridBridge.instance = this;
    }
  }

  public static getInstance(): HybridBridge {
    if (!HybridBridge.instance) {
      HybridBridge.instance = new HybridBridge();
    }
    return HybridBridge.instance;
  }

  /**
   * Record a push alert event
   */
  public recordPushAlert() {
    this.metrics.pushAlertCount++;
  }

  // ─── Health Check ───────────────────────────────────────
  startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await Promise.all([
        this.checkHealth('ncp'),
        this.checkHealth('ibm'),
      ]);
      console.log(`[Airpulse Health] NCP: ${this.metrics.ncp.status} (${this.metrics.ncp.latencyMs}ms) | IBM: ${this.metrics.ibm.status} (${this.metrics.ibm.latencyMs}ms)`);
    }, CIRCUIT_BREAKER.healthCheckIntervalMs);
  }

  stopHealthChecks(): void {
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
  }

  private async checkHealth(cloud: 'ncp' | 'ibm'): Promise<void> {
    const client = cloud === 'ncp' ? this.ncpClient : this.ibmClient;
    const health = this.metrics[cloud];
    const start = Date.now();

    try {
      await client.get('/health');
      health.latencyMs = Date.now() - start;
      health.consecutiveFailures = 0;
      health.status = health.latencyMs > 2000 ? 'degraded' : 'healthy';
    } catch {
      health.consecutiveFailures++;
      health.latencyMs = Date.now() - start;
      health.status = health.consecutiveFailures >= CIRCUIT_BREAKER.maxFailures ? 'down' : 'degraded';
    }
    health.lastChecked = new Date();
  }

  // ─── Primary Selection (Active-Active) ──────────────────
  private selectPrimary(): 'ncp' | 'ibm' {
    const ncpHealth = this.metrics.ncp;
    const ibmHealth = this.metrics.ibm;

    // If one is down, use the other
    if (ncpHealth.status === 'down' && ibmHealth.status !== 'down') return 'ibm';
    if (ibmHealth.status === 'down' && ncpHealth.status !== 'down') return 'ncp';

    // Both healthy → pick lowest latency
    return ncpHealth.latencyMs <= ibmHealth.latencyMs ? 'ncp' : 'ibm';
  }

  // ─── Dual-Write Sync with Automatic Failover ───────────
  async syncData(payload: any): Promise<SyncResult> {
    this.metrics.totalRequests++;
    const primary = this.selectPrimary();
    const start = Date.now();
    let failoverUsed = false;

    try {
      // 1. Write to Primary
      const primaryRes = await this.writeToCloud(primary, payload);

      // 2. Async Replicate to Secondary (non-blocking)
      const secondary = primary === 'ncp' ? 'ibm' : 'ncp';
      this.writeToCloud(secondary, { ...payload, _replicaOf: primaryRes.id }).catch((err) => {
        console.warn(`[Airpulse] Async replication to ${secondary} failed:`, err.message);
      });

      return {
        success: true,
        primary,
        primaryId: primaryRes.id,
        failoverUsed,
        latencyMs: Date.now() - start,
      };

    } catch (primaryError) {
      // 3. Primary failed → Failover to Secondary
      console.warn(`[Airpulse] Primary (${primary}) failed, triggering failover...`);
      failoverUsed = true;
      this.metrics.failoverCount++;

      const fallback = primary === 'ncp' ? 'ibm' : 'ncp';
      try {
        const fallbackRes = await this.writeToCloud(fallback, payload);
        return {
          success: true,
          primary: fallback,
          primaryId: fallbackRes.id,
          failoverUsed: true,
          latencyMs: Date.now() - start,
        };
      } catch (fallbackError) {
        // Both clouds failed
        console.error('[Airpulse] CRITICAL: Both NCP and IBM are unreachable!');
        throw new Error('AIRPULSE_DUAL_CLOUD_FAILURE');
      }
    }
  }

  private async writeToCloud(cloud: 'ncp' | 'ibm', payload: any): Promise<{ id: string }> {
    const client = cloud === 'ncp' ? this.ncpClient : this.ibmClient;
    const endpoint = cloud === 'ncp' ? '/process' : '/cloudant/sync';
    const res = await client.post(endpoint, payload);
    return { id: res.data.id };
  }

  // ─── Metrics Export (for Prometheus) ────────────────────
  getMetrics(): BridgeMetrics {
    return { ...this.metrics };
  }
}
