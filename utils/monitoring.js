/**
 * Performance Monitoring & Health Checks
 * System metrics, database performance, memory usage
 */

import { logInfo, logWarn, logError } from './logger.js';
import { getRateLimitStats } from './rateLimiter.js';
import { getSecurityStats } from './security.js';

/**
 * System metrics tracking
 */
const metrics = {
  startTime: Date.now(),
  commandsProcessed: 0,
  errorsCount: 0,
  dbQueries: 0,
  avgResponseTime: 0,
  peakMemoryUsage: 0,
  lastHealthCheck: null
};

/**
 * Command performance tracking
 */
const commandMetrics = new Map();

/**
 * Records command execution
 */
export function recordCommandExecution(commandName, executionTime, success = true) {
  metrics.commandsProcessed++;
  if (!success) metrics.errorsCount++;
  
  // Update average response time
  metrics.avgResponseTime = ((metrics.avgResponseTime * (metrics.commandsProcessed - 1)) + executionTime) / metrics.commandsProcessed;
  
  // Track per-command metrics
  if (!commandMetrics.has(commandName)) {
    commandMetrics.set(commandName, {
      executions: 0,
      totalTime: 0,
      errors: 0,
      avgTime: 0
    });
  }
  
  const cmdMetrics = commandMetrics.get(commandName);
  cmdMetrics.executions++;
  cmdMetrics.totalTime += executionTime;
  if (!success) cmdMetrics.errors++;
  cmdMetrics.avgTime = cmdMetrics.totalTime / cmdMetrics.executions;
}

/**
 * Records database query
 */
export function recordDatabaseQuery(queryTime) {
  metrics.dbQueries++;
  // Could track query performance here
}

/**
 * Gets current system metrics
 */
export function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const uptime = Date.now() - metrics.startTime;
  
  // Update peak memory usage
  metrics.peakMemoryUsage = Math.max(metrics.peakMemoryUsage, memUsage.heapUsed);
  
  return {
    uptime: uptime,
    uptimeFormatted: formatUptime(uptime),
    commandsProcessed: metrics.commandsProcessed,
    errorsCount: metrics.errorsCount,
    errorRate: metrics.commandsProcessed ? (metrics.errorsCount / metrics.commandsProcessed * 100).toFixed(2) + '%' : '0%',
    avgResponseTime: Math.round(metrics.avgResponseTime * 100) / 100,
    dbQueries: metrics.dbQueries,
    memoryUsage: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100 // MB
    },
    peakMemoryUsage: Math.round(metrics.peakMemoryUsage / 1024 / 1024 * 100) / 100, // MB
    lastHealthCheck: metrics.lastHealthCheck
  };
}

/**
 * Gets command performance metrics
 */
export function getCommandMetrics() {
  const topCommands = Array.from(commandMetrics.entries())
    .sort((a, b) => b[1].executions - a[1].executions)
    .slice(0, 10)
    .map(([name, stats]) => ({
      command: name,
      executions: stats.executions,
      avgTime: Math.round(stats.avgTime * 100) / 100,
      errors: stats.errors,
      errorRate: (stats.errors / stats.executions * 100).toFixed(2) + '%'
    }));
  
  return {
    totalCommands: commandMetrics.size,
    topCommands
  };
}

/**
 * Performs comprehensive health check
 */
export async function performHealthCheck(client) {
  const healthReport = {
    timestamp: new Date(),
    status: 'healthy',
    checks: {},
    metrics: {}
  };
  
  try {
    // System metrics
    const systemMetrics = getSystemMetrics();
    healthReport.metrics.system = systemMetrics;
    
    // Memory check
    if (systemMetrics.memoryUsage.heapUsed > 500) { // 500MB threshold
      healthReport.checks.memory = {
        status: 'warning',
        message: `High memory usage: ${systemMetrics.memoryUsage.heapUsed}MB`
      };
    } else {
      healthReport.checks.memory = {
        status: 'healthy',
        message: `Memory usage: ${systemMetrics.memoryUsage.heapUsed}MB`
      };
    }
    
    // Error rate check
    const errorRate = parseFloat(systemMetrics.errorRate);
    if (errorRate > 5) {
      healthReport.checks.errorRate = {
        status: 'warning',
        message: `High error rate: ${systemMetrics.errorRate}`
      };
      healthReport.status = 'warning';
    } else {
      healthReport.checks.errorRate = {
        status: 'healthy',
        message: `Error rate: ${systemMetrics.errorRate}`
      };
    }
    
    // Database health check
    try {
      if (global.logsCollection) {
        const startTime = Date.now();
        await global.logsCollection.findOne({}, { limit: 1 });
        const dbResponseTime = Date.now() - startTime;
        
        if (dbResponseTime > 1000) {
          healthReport.checks.database = {
            status: 'warning',
            message: `Slow database response: ${dbResponseTime}ms`
          };
        } else {
          healthReport.checks.database = {
            status: 'healthy',
            message: `Database response: ${dbResponseTime}ms`
          };
        }
      } else {
        healthReport.checks.database = {
          status: 'error',
          message: 'Database collection not initialized'
        };
        healthReport.status = 'unhealthy';
      }
    } catch (error) {
      healthReport.checks.database = {
        status: 'error',
        message: `Database error: ${error.message}`
      };
      healthReport.status = 'unhealthy';
    }
    
    // Discord client check
    if (client && client.isReady()) {
      healthReport.checks.discord = {
        status: 'healthy',
        message: `Connected to ${client.guilds.cache.size} guilds`
      };
    } else {
      healthReport.checks.discord = {
        status: 'error',
        message: 'Discord client not ready'
      };
      healthReport.status = 'unhealthy';
    }
    
    // Rate limiter metrics
    const rateLimitStats = getRateLimitStats();
    healthReport.metrics.rateLimiter = rateLimitStats;
    
    // Security metrics
    const securityStats = getSecurityStats();
    healthReport.metrics.security = securityStats;
    
    // Command metrics
    const commandStats = getCommandMetrics();
    healthReport.metrics.commands = commandStats;
    
    metrics.lastHealthCheck = healthReport.timestamp;
    
    // Log health check results
    if (healthReport.status === 'healthy') {
      logInfo(client, 'Health check completed - all systems healthy', {
        uptime: systemMetrics.uptimeFormatted,
        memoryUsage: systemMetrics.memoryUsage.heapUsed,
        commandsProcessed: systemMetrics.commandsProcessed,
        action: 'health_check_completed'
      });
    } else {
      logWarn(client, `Health check completed - status: ${healthReport.status}`, {
        issues: Object.entries(healthReport.checks)
          .filter(([_, check]) => check.status !== 'healthy')
          .map(([name, check]) => `${name}: ${check.message}`),
        action: 'health_check_warning'
      });
    }
    
    return healthReport;
  } catch (error) {
    logError(client, `Health check failed: ${error.message}`);
    return {
      timestamp: new Date(),
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Formats uptime in human readable format
 */
function formatUptime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Starts periodic health checks
 */
export function startPeriodicHealthChecks(client, intervalMinutes = 30) {
  setInterval(async () => {
    await performHealthCheck(client);
  }, intervalMinutes * 60 * 1000);
  
  logInfo(client, `Periodic health checks started (every ${intervalMinutes} minutes)`);
}

/**
 * Gets performance alerts
 */
export function getPerformanceAlerts() {
  const alerts = [];
  const systemMetrics = getSystemMetrics();
  
  // Memory alerts
  if (systemMetrics.memoryUsage.heapUsed > 500) {
    alerts.push({
      type: 'memory',
      severity: 'warning',
      message: `High memory usage: ${systemMetrics.memoryUsage.heapUsed}MB`
    });
  }
  
  // Error rate alerts
  const errorRate = parseFloat(systemMetrics.errorRate);
  if (errorRate > 10) {
    alerts.push({
      type: 'error_rate',
      severity: 'critical',
      message: `Very high error rate: ${systemMetrics.errorRate}`
    });
  } else if (errorRate > 5) {
    alerts.push({
      type: 'error_rate',
      severity: 'warning',
      message: `High error rate: ${systemMetrics.errorRate}`
    });
  }
  
  // Response time alerts
  if (systemMetrics.avgResponseTime > 1000) {
    alerts.push({
      type: 'response_time',
      severity: 'warning',
      message: `Slow response time: ${systemMetrics.avgResponseTime}ms`
    });
  }
  
  return alerts;
}
