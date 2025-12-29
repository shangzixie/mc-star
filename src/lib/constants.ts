/**
 * Max file size (4MB)
 * https://vercel.com/docs/functions/limitations#request-body-size
 */
export const MAX_FILE_SIZE = 4 * 1024 * 1024;

/**
 * in next 30 days for credits expiration
 */
export const CREDITS_EXPIRATION_DAYS = 30;

/**
 * Polling interval (2 seconds)
 */
export const PAYMENT_POLL_INTERVAL = 2000;

/**
 * Max polling time (1 minute)
 */
export const PAYMENT_MAX_POLL_TIME = 60000;

/**
 * Max retry attempts for finding payment records
 */
export const PAYMENT_RECORD_RETRY_ATTEMPTS = 30;

/**
 * Retry delay between attempts (2 seconds)
 */
export const PAYMENT_RECORD_RETRY_DELAY = 2000;
