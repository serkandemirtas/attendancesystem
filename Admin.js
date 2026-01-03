/**
 * ADMIN.GS
 * Functions for the QR Display Panel
 */

function getSystemConfig() {
  // Returns location settings and max allowed distance from global constants
  return { lat: LOCATION_LAT, lng: LOCATION_LNG, maxDistance: MAX_DISTANCE_METERS };
}

function getAdminConfig() {
  // Returns configuration needed by the client-side Admin UI
  return {
    url: ScriptApp.getService().getUrl(), // Dynamically retrieves the active Web App URL
    secret: SECRET_KEY,                   // The shared secret key defined in Globals
    refreshRate: TIME_STEP                // How often (in ms) the QR code should refresh
  };
}

function getAdminToken() {
  // Generates a time-based token for the QR code
  const now = new Date().getTime();
  
  // Calculate the current time bucket based on the time step
  // (e.g., if TIME_STEP is 20000ms, this changes every 20 seconds)
  const currentBucket = Math.floor(now / TIME_STEP);
  
  // Generate and return the hash for the current time bucket
  return createHash(currentBucket);
}