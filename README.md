# WNM Helper

WNM Helper is an intelligent application designed to manage, monitor, and assist with agricultural crop plots (such as Yam, Pepper, Pak Choy, Tomato, and Corn). 
## 📦 Installation Instructions



---

### Desktop Application (Windows Installer)
If you have been provided with the `WNM-helper setup.exe` file:

1. Locate the `WNM-helper setup.exe` file on your computer.
2. Double-click the executable to launch the installation wizard.
3. Follow the on-screen instructions to select your installation directory and create desktop shortcuts.
4. Once the installation is complete, you can launch **WNM Helper** directly from your desktop or the Windows Start Menu.

*(Note: Once installed, you do not need to keep the original setup.exe file in the same folder as the installed program. The installed app runs independently).*

---



#### Setup Steps

1. **Open your Terminal or Command Prompt:**
   Navigate into the project directory where you extracted the files:
   ```bash
   cd path/to/wnm-helper
   ```

2. **Install Dependencies:**
   Run the following command to download all required software packages:
   ```bash
   npm install
     ```

3. **Start the Application:**
   Start the local development server by running:
   ```bash
   npm run dev
   ```
   *The terminal will display a local URL (e.g., `http://localhost:3000`). Open that link in your web browser to view the application.*

4. **Building the App (Optional):**
   If you want to compile the project into static files for deployment, run:
   ```bash
   npm run build
   ```
   This will generate a `dist` folder containing the compiled, production-ready website.

---

## 🛠 Troubleshooting
- **Missing Images/Logos:** Ensure that your image files (like `Yam.png`, `Tomato.jpg`, `WNM logo 2.png`) are located inside the correct root directory or `public/` folder before launching the application or building your `.exe`.
- **White screen on Desktop execution:** Double-check that your packaging settings (like `base: './'` in `vite.config.ts`) were included when building the desktop files.
