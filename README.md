#📍 Secure QR & GPS Based Attendance System

A serverless, anti-cheat attendance management system built with **Google Apps Script** and **Google Sheets**. This project verifies physical presence using **GPS Geofencing** and secures the process with **Dynamic QR Codes** and **Device Fingerprinting**.

## 🚀 Key Features

* **Dynamic QR Code Generation:**
    The Admin Panel generates a time-based rotating QR code (TOTP-like logic) that expires every 20 seconds, preventing students from taking photos of the code and sharing it remotely.

* **GPS Geofencing:**
    The system calculates the real-time distance between the student's device and the target venue (e.g., classroom) using the Haversine formula. Attendance is strictly rejected if the student is outside the allowed radius.

* **Anti-Cheat Device Locking:**
    Uses browser fingerprinting and `localStorage` to lock a specific device to a single Student ID. This prevents one student from logging in on behalf of others using the same phone.

* **Automated Google Sheets Database:**
    * **Scholars Sheet:** Serves as the master data for student validation.
    * **Attendance Sheet:** Automatically expands columns for new months, recording status, coordinates, ratings, and feedback.
 

https://github.com/user-attachments/assets/834f7250-ac40-41e6-9ca3-b280ba22bc79


## 🛠️ Technical Architecture

* **Backend:** Google Apps Script (Serverless Node.js-like environment).
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (embedded in GAS).
* **Database:** Google Sheets.
* **Deployment:** `clasp` (Command Line Apps Script).

## 📂 File Structure

|      File       |                               Description                                     |
| :---| :---|
| `Main.js`       | Entry point. Handles HTTP GET requests and routing (Admin vs. Student view).  |
| `Attendance.js` | Core logic for student login, database queries, and attendance submission.    |
| `Auth.js`       | Security logic generating SHA-1 hashes for time-based token verification.     |
| `Utils.js`      | Helper functions for distance calculation (Haversine) and text normalization. |
| `Config.js`     | Configuration constants (Lat/Lng, Secret Keys, Time Step).                    |
| `index.html`    | The client-side application for students (GPS, Form, Fingerprinting).         |

## ⚙️ Installation & Setup

### 1. Clone & Push
 
Clone the repository and push the code to your Google Apps Script project using `clasp`:

```bash
git clone https://github.com/serkandemirtas/attendancesystem.git
npm install 
clasp login
clasp create --title "Attendance System" --type webapp
clasp push
```

### 2. Database Setup (Google Sheets)

Create a new Google Sheet and create two tabs with the exact following headers:

Tab 1: Scholars (Master Data) | Column A | Column B | Column C   | Column D   |
                              | :---| :---| :---|:---|
                              |     ID   |  Name    | University | Department |

<img width="945" height="401" alt="Ekran görüntüsü 2026-01-04 033049" src="https://github.com/user-attachments/assets/d3c5b472-9ebc-4b6e-9385-fcf5c230c790" />


Tab 2: Attendance (Transaction Data) | Column A | Column B |
                                     | :---| :---|
                                     |    ID    |   Name   | (The system will automatically add columns C, D, E... for each new month)
                                     
<img width="380" height="331" alt="Ekran görüntüsü 2026-01-04 033101" src="https://github.com/user-attachments/assets/e29f42da-2228-4b72-8c99-9cca94b3fe04" />

<img width="1240" height="397" alt="Ekran görüntüsü 2026-01-04 033121" src="https://github.com/user-attachments/assets/80d6fe05-2e2c-4487-a4b4-19ad4e24ae42" />


### 3. Configuration

Edit Config.js to set your target location and security keys:

```
// Config.js
const LOCATION_LAT = 41.0082; // Your Venue Latitude
const LOCATION_LNG = 28.9784; // Your Venue Longitude
const MAX_DISTANCE_METERS = 100; // Allowed Radius
const SECRET_KEY = "CHANGE_THIS_TO_A_SECURE_STRING";
```

### 4. Deployment

Deploy the project as a Web App:

Go to Google Apps Script Editor -> Deploy -> New Deployment.

Select Web App.

Execute as: Me (your account).

Who has access: Anyone (or Anyone with Google Account).


## 🔒 Security Notice

The Config.js file contains the SECRET_KEY. Do not commit your production secret key to public repositories. Use environment variables or a placeholder when sharing code.
