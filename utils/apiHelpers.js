/**
 * API Helper Utilities - Timeout and Error Handling
 */

// Fetch with timeout wrapper
function fetchWithTimeout(url, options = {}, timeout = 8000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Promise with timeout
function promiseWithTimeout(promise, timeout = 8000, errorMsg = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeout)
    )
  ]);
}

// Safe API call wrapper
window.safeApiCall = async function(apiFunction, fallbackValue = null, timeout = 8000) {
  try {
    const result = await promiseWithTimeout(apiFunction(), timeout);
    return result;
  } catch (error) {
    console.warn('API call failed:', error.message);
    return fallbackValue;
  }
};
