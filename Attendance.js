/**
 * ATTENDANCE.GS
 * Database Logic: Login & Process Attendance
 */

// Entry point for HTTP POST requests from the client app
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // ROUTE 1: Student Login / Search
    if (data.action === 'login') {
      return json(loginStudent(data.id, data.deviceId));
    }

    // ROUTE 2: Submit Attendance
    if (data.action === 'submit') {
      // Use LockService to prevent race conditions (multiple people submitting at the exact same millisecond)
      const lock = LockService.getScriptLock();
      // Try to get the lock for 30 seconds
      if (!lock.tryLock(30000)) { 
        return json({ ok: false, msg: 'Server is busy, please wait.' });
      }
      try {
        // Process the data safely
        return json(processAttendance(data));
      } finally {
        // Always release the lock, even if an error occurs
        lock.releaseLock();
      }
    }

    return json({ ok: false, msg: 'Invalid Action' });
  } catch (err) {
    return json({ ok: false, msg: 'Error: ' + err.message });
  }
}

// Logic: Check 'Scholars' sheet first for info, then check if already attended in 'Attendance' sheet
function loginStudent(id, deviceId) {
  const ss = SpreadsheetApp.getActive();
  const shScholars = ss.getSheetByName('Scholars'); 
  const shAttendance = ss.getSheetByName('Attendance');
  
  // Basic validation to ensure sheets exist
  if (!shScholars || !shAttendance) return { ok: false, msg: 'Database Error: Sheets not found!' };
  
  const searchId = String(id).trim();
  const currentMonth = getCurrentMonth();

  // 1. Find User in Scholars List (Master Data)
  // Get all data from the Scholars sheet (ID, Name, Uni, Dept)
  const scholarData = shScholars.getRange(2, 1, Math.max(1, shScholars.getLastRow() - 1), 4).getValues();
  let foundUser = null;
  
  // Iterate through rows to find the matching ID
  for (const r of scholarData) {
    if (String(r[0]).trim() === searchId) {
      foundUser = { name: r[1], university: r[2], department: r[3] };
      break;
    }
  }
  if (!foundUser) return { ok: false, msg: 'Student ID not found in Scholars list.' };

  // 2. Check Previous Attendance (Transaction Data)
  // Find where the current month's data starts
  const monthStartCol = findMonthColumn(shAttendance, currentMonth);
  
  if (monthStartCol > 0) {
    const lastRow = shAttendance.getLastRow();
    // Get all IDs from the Attendance sheet (Column 1)
    const ids = shAttendance.getRange(1, 1, lastRow, 1).getValues();
    let userRow = -1;
    
    // Find the row number for this user in the Attendance sheet
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === searchId) { userRow = i + 1; break; }
    }
    
    // If user exists in Attendance sheet
    if (userRow > -1) {
      // Check the "Status" column for this month to see if they already marked attendance
      const cellValue = shAttendance.getRange(userRow, monthStartCol + 1).getValue();
      
      // If Status cell is not empty, they already submitted
      if (cellValue !== "") {
        let recordedDist = shAttendance.getRange(userRow, monthStartCol + 7).getValue();
        // Return existing data so the client can show "Already Submitted" screen
        return { ok: true, alreadySubmitted: true, status: cellValue, distance: recordedDist, ...foundUser };
      }
    }
  }
  // User found, but hasn't submitted yet
  return { ok: true, alreadySubmitted: false, ...foundUser };
}

// Logic: Verify Token -> Find/Create Month Column -> Find User Row -> Update Cells
function processAttendance(d) {
  // Security Check: Ensure the QR token is valid and hasn't expired
  if (!d.qrToken || !verifyTimeToken(d.qrToken)) {
    return { ok: false, msg: 'QR Code EXPIRED! Please scan the new code.' };
  }

  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName('Attendance');
    const currentMonthFull = getCurrentMonth();
    const searchId = String(d.id).trim(); 
    const deviceId = String(d.deviceId || "").trim();

    SpreadsheetApp.flush(); // Ensure we have the latest data
    
    // Find Month Column or Create New Block if it's a new month
    let monthStartCol = findMonthColumn(sh, currentMonthFull);
    
    if (monthStartCol === 0) {
      // Create a new block of columns at the end of the sheet
      monthStartCol = sh.getLastColumn() + 1;
      // Creates 8 columns block in English for the new month
      sh.getRange(1, monthStartCol, 1, 8).setValues([[currentMonthFull, "Status", "Location", "Rating", "Feedback", "Date", "DeviceID", "Distance (m)"]]);
      // Style the header
      sh.getRange(1, monthStartCol, 1, 8).setBackground("#d1e7ff").setFontWeight("bold");
    }

    // Find the user's row index
    const lastRow = sh.getLastRow();
    const ids = sh.getRange(1, 1, lastRow, 1).getValues();
    let rowIndex = -1;
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === searchId) { rowIndex = i + 1; break; }
    }
    
    if (rowIndex === -1) return { ok: false, msg: 'Your ID is not in the Attendance list.' };

    // Double-check: Check if cell is empty before writing to avoid overwriting
    const statusCell = sh.getRange(rowIndex, monthStartCol + 1);
    if (statusCell.getValue() !== "") return { ok: false, msg: 'You have already submitted.' };

    // Calculate distance and determine status
    const distance = calculateDistance(d.lat, d.lng, LOCATION_LAT, LOCATION_LNG);
    const status = (distance <= MAX_DISTANCE_METERS) ? 'PRESENT' : 'ABSENT';
    
    // Update specific cells relative to month start column
    // offset +0: Month Name
    sh.getRange(rowIndex, monthStartCol).setValue(currentMonthFull); 
    // offset +1: Status (Present/Absent)
    sh.getRange(rowIndex, monthStartCol + 1).setValue(status);  
    // offset +2: GPS Coordinates
    sh.getRange(rowIndex, monthStartCol + 2).setValue(`${d.lat}, ${d.lng}`);
    // offset +3: Rating
    sh.getRange(rowIndex, monthStartCol + 3).setValue(d.rating);
    // offset +4: Feedback
    sh.getRange(rowIndex, monthStartCol + 4).setValue(d.feedback);
    // offset +5: Timestamp
    sh.getRange(rowIndex, monthStartCol + 5).setValue(new Date());
    // offset +6: Device ID
    sh.getRange(rowIndex, monthStartCol + 6).setValue(deviceId);
    // offset +7: Calculated Distance
    sh.getRange(rowIndex, monthStartCol + 7).setValue(Math.round(distance));

    return { ok: true, msg: 'Attendance Successful.', status: status, distance: Math.round(distance) };
    
  } catch (error) { 
    return { ok: false, msg: 'Server Error: ' + error.message }; 
  } 
}