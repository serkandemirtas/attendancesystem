/**
 * UTILS.GS
 * Helper functions
 */

// Generates the column header string (e.g., "October 2023")
function getCurrentMonth() { 
  const d = new Date(); 
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; 
  // Returns format: "MonthName Year"
  return (months[d.getMonth()] + " " + d.getFullYear()).trim(); 
}

// Cleans and standardizes text for reliable comparisons
function normalizeText(str) { 
  if (!str) return ""; 
  // If a Date object is passed (sometimes happens with Excel/Sheets dates), convert to month string
  if (str instanceof Date) return getCurrentMonth().toLowerCase(); 
  
  // Handles Turkish characters mapping to English for robust comparison
  // This prevents errors where "İSTANBUL" != "istanbul" due to the 'İ'/'I' difference
  return String(str)
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width spaces/invisible chars
    .trim().toLowerCase()
    .replace(/\s+/g, " ")                  // Collapse multiple spaces into one
    .replace(/İ/g, "i").replace(/I/g, "i") // Turkish specific replacements
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ç/g, "c").replace(/ç/g, "c"); 
}

// Logic: Scans headers to find the current month's column index
function findMonthColumn(sheet, monthName) { 
  // Get the first row (headers) up to a reasonable limit (200 cols or last col)
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 200)).getValues()[0]; 
  
  const normalizedSearch = normalizeText(monthName); 
  
  // Iterate through headers to find a match
  for (let i = 0; i < headers.length; i++) { 
    if (normalizeText(headers[i]) === normalizedSearch) return i + 1; // Return 1-based index
  } 
  return 0; // Return 0 if not found
}

// Haversine Formula: Calculates distance in meters between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) { 
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180; 
  const dLon = (lon2 - lon1) * Math.PI / 180; 
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
}

// Helper to standardise API responses
function json(obj){ 
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); 
}