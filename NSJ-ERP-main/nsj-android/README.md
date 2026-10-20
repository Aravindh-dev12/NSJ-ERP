# NSJ ERP - Android Mobile App (APK)

This directory contains the ready-to-build native Android Studio wrapper project for the NSJ ERP system.

## 📱 Features
- **Full Screen & Responsive**: Adapts seamlessly to all Android phone and tablet screens.
- **Full JavaScript & Storage**: Enables authentication tokens, session persistence, and dynamic React components.
- **Pull-To-Refresh**: Integrated `SwipeRefreshLayout` to quickly refresh ERP dashboards.
- **File Upload Support**: Full `WebChromeClient` implementation for uploading order designs, vouchers, bills, and taking camera photos.
- **External Handlers**: Automatically handles `tel:`, `mailto:`, and `whatsapp:` links.

---

## 🛠 How to Build the APK

### Option 1: Android Studio (Recommended)
1. Open **Android Studio**.
2. Select **File > Open...** and navigate to:
   ```
   C:\Users\ADMIN\Desktop\NSJ-ERP\NSJ-ERP-main\nsj-android
   ```
3. Allow Gradle to sync.
4. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Once built, Android Studio will display a popup: **locate APK**.
   The output APK will be located at:
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```
6. Transfer `app-debug.apk` to your Android device and tap to install!

### Option 2: Command Line (with JDK & Android SDK)
If you have Java & Android SDK installed:
```bash
cd nsj-android
gradle assembleDebug
```
The output APK is generated at:
```
app\build\outputs\apk\debug\app-debug.apk
```

---

## 🌐 Changing the Server URL
By default, the app is configured to connect to your local development server:
`http://10.118.205.103:3000`

When you deploy the backend and frontend to a live cloud domain (e.g. `https://erp.yourdomain.com`), simply update `server_url` in:
```
app/src/main/res/values/strings.xml
```
```xml
<resources>
    <string name="app_name">NSJ ERP</string>
    <string name="server_url">https://your-production-url.com</string>
</resources>
```
And re-build the APK!
