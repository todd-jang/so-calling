import os from 'os';
import { HybridBridge } from '../ncp-ibm/bridge';

/**
 * Enhanced Metrics Exporter for Prometheus
 * Provides system-level and business-level insights.
 */
export const getPrometheusMetrics = () => {
  const bridge = HybridBridge.getInstance();
  const m = bridge.getMetrics();
  
  // System Metrics
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;
  const loadAvg = os.loadavg()[0]; // 1-minute load average

  return `
# HELP airpulse_bridge_requests_total Total requests processed by the bridge
# TYPE airpulse_bridge_requests_total counter
airpulse_bridge_requests_total ${m.totalRequests}

# HELP airpulse_bridge_failover_total Total failover events occurred
# TYPE airpulse_bridge_failover_total counter
airpulse_bridge_failover_total ${m.failoverCount}

# HELP airpulse_push_alerts_total Total push notifications sent
# TYPE airpulse_push_alerts_total counter
airpulse_push_alerts_total ${m.pushAlertCount}

# HELP system_memory_usage_percent Current system memory usage in percent
# TYPE system_memory_usage_percent gauge
system_memory_usage_percent ${memUsage.toFixed(2)}

# HELP system_cpu_load_1min System load average for the last 1 minute
# TYPE system_cpu_load_1min gauge
system_cpu_load_1min ${loadAvg.toFixed(2)}

# HELP system_uptime_seconds System uptime in seconds
# TYPE system_uptime_seconds counter
system_uptime_seconds ${process.uptime()}
  `.trim();
};
