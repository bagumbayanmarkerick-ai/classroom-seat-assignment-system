# Classroom Seats — installable offline web app

This is an installable web app (PWA) for desktop and Android. It stores class sections, student names, seats, optional pictures, subjects, grades, and attendance in the browser's local IndexedDB database and caches the app files for offline use. Each section has its own roster, seating plan, and attendance history. The seating plan shows two five-column seating blocks with an aisle and front-of-room furniture. The first open needs an internet connection; after the app is installed and has loaded once, its main features work offline.

## Put it online

PWAs need a secure website address (HTTPS) for installation and offline caching. Publish the entire `classroom-pwa` folder to a static hosting service that gives you an HTTPS URL. For example, on GitHub Pages, create a repository, upload these files, then enable Pages in the repository settings. A static hosting service such as Netlify or Cloudflare Pages also works. Keep the files together in the same folder path.

## Install on Android

1. Open the HTTPS address in Chrome while online.
2. Wait for the page to finish loading once.
3. Tap **Install app** if it appears, or open Chrome's ⋮ menu and choose **Install app** or **Add to Home screen**.
4. Open Classroom Seats from the home screen. It can then be used offline.

## Install on a computer

Open the HTTPS address in Chrome or Edge, then use the install icon in the address bar or the browser menu's **Install app** option. The app opens in its own window and works offline after the first load.

## Notes

- Each student's picture, subject, and grade are optional. Seat labels and student names must be unique.
- The seating map uses A1–E4 for the left block and G1–K4 for the right block. Other seat labels remain visible in an unplaced list.
- Add sections with the section form, then switch between them with the section menu. Each section's records remain separate on the device.
- Data is stored only in the current browser on the current device. It is not synced between a teacher's phone and computer. Use the same device/browser to see its records.
- Clearing browser site data can erase the roster and attendance. This version does not include export/backup yet.
- No account or server database is used.
