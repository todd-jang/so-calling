export class HybridBridge {
  static getInstance() {
    return new HybridBridge();
  }
  getMetrics() {
    return {
      totalRequests: 0,
      failoverCount: 0,
      pushAlertCount: 0,
      ncp: { status: 'mock', latencyMs: 0, consecutiveFailures: 0 },
      ibm: { status: 'mock', latencyMs: 0, consecutiveFailures: 0 }
    };
  }
  recordPushAlert() {}
  async syncData(_: any) {}
}
