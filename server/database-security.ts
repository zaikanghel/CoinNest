/**
 * Database Security Configuration
 * This file contains security-related settings for MongoDB connections
 */

import { MongoClientOptions } from 'mongodb';

/**
 * A whitelist of IP addresses that are allowed to connect to our MongoDB database.
 * In production, this would be set to specific IP addresses of your application servers only.
 */
export const IP_WHITELIST = [
  process.env.SERVER_IP || '0.0.0.0', // Your server's IP
];

/**
 * MongoDB connection options with security best practices
 */
export const MONGO_SECURITY_OPTIONS: MongoClientOptions = {
  // Connection timeouts
  connectTimeoutMS: 30000,         // 30 seconds connection timeout
  socketTimeoutMS: 45000,          // 45 seconds socket timeout
  serverSelectionTimeoutMS: 60000, // 1 minute server selection timeout
  
  // Connection pool limits
  maxPoolSize: 10,                 // Limit connection pool size
  minPoolSize: 1,                  // Minimum connections maintained
  maxIdleTimeMS: 60000,            // Close idle connections after 1 minute
  
  // Data consistency
  retryWrites: true,               // Auto-retry writes if they fail
  retryReads: true,                // Auto-retry reads if they fail
  
  // Security settings
  tls: true,                        // Use TLS for secure connections
  tlsAllowInvalidCertificates: false, // Reject invalid certs
  tlsAllowInvalidHostnames: false,    // Reject hostname mismatch
};

/**
 * Sanitizes and logs a database connection string by hiding credentials
 * @param connectionString - The MongoDB connection string
 * @returns A sanitized version of the connection string with credentials hidden
 */
export function sanitizeConnectionString(connectionString: string): string {
  // Replace username:password with [REDACTED] to avoid logging credentials
  return connectionString.replace(/\/\/([^:]+):[^@]+@/, '//[REDACTED]:[REDACTED]@');
}

/**
 * Validates if the current server's IP is in the allowed whitelist
 * In a real production environment, you would implement this with the actual server IP
 * @returns true if the server IP is allowed, false otherwise
 */
export function isServerIpAllowed(): boolean {
  // In a real environment, you would get the actual server IP
  const serverIp = process.env.SERVER_IP || '0.0.0.0';
  return IP_WHITELIST.includes(serverIp);
}
