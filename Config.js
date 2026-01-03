/**
 * CONFIGURATION FILE
 * Stores system-wide constants and settings.
 */

// GPS coordinates of the classroom (Target Location)
const LOCATION_LAT = 41.000000; // Your coordinate
const LOCATION_LNG = 28.000000; //Your cooordinate

// Maximum allowed distance in meters (Geofencing radius)
// Students must be within this range to be marked "Present"
const MAX_DISTANCE_METERS = 1000; 

// Secret key used to salt the hash function for security
// CHANGE THIS to a random string for production!
const SECRET_KEY = "Your-secret-key"; 

// Time interval for QR code rotation in milliseconds (20 seconds)
const TIME_STEP = 20000;