/**
 * AUTH.GS
 * Token Verification Logic
 */

// Function to generate a secure hash for a specific time window
function createHash(timeBucket) {
  // Combine the time bucket (timestamp identifier) with the secret key
  const payload = timeBucket + "_" + SECRET_KEY;
  
  // Compute the SHA-1 digest of the payload
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, payload);
  
  // Convert the byte array to a hexadecimal string
  let txtHash = "";
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    
    // Handle negative byte values (convert to unsigned 0-255)
    if (hashVal < 0) hashVal += 256;
    
    // Add leading zero if hex value is single digit
    if (hashVal.toString(16).length == 1) txtHash += "0";
    
    // Append the hex value
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

// Function to verify if a received token is valid
function verifyTimeToken(token) {
  if (!token) return false;
  token = String(token).trim();
  
  const now = new Date().getTime();
  // Calculate the current time bucket
  const currentBucket = Math.floor(now / TIME_STEP);
  
  // Set a tolerance window (e.g., allow tokens from approx 80 seconds ago or in future)
  // This handles network lag or slight server/client clock mismatches
  const tolerance = 4; 

  // Check the token against the current bucket and the tolerance range
  for (let i = -tolerance; i <= tolerance; i++) {
    if (token === createHash(currentBucket + i)) return true; // Valid match found
  }
  return false; // No match found
}

// Wrapper function to expose verification logic
function checkTokenValidity(token) {
  return verifyTimeToken(token);
}