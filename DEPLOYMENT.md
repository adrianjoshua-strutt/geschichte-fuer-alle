# Geschichte für Alle - Deployment Guide

## GitHub Pages Setup

To deploy this application to GitHub Pages:

1. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Under "Source", select the branch (e.g., `main` or `copilot/create-github-pages-app`)
   - Save the settings

2. **Your site will be available at:**
   ```
   https://adrianjoshua-strutt.github.io/geschichte-f-r-alle/
   ```

3. **Individual location pages will be accessible via:**
   ```
   https://adrianjoshua-strutt.github.io/geschichte-f-r-alle/dom
   https://adrianjoshua-strutt.github.io/geschichte-f-r-alle/stadtschloss
   ```

## Adding New Locations

To add a new location:

1. Create a text file in the `content/` directory:
   ```
   content/{location-name}.txt
   ```

2. (Optional) Add an audio file:
   ```
   content/{location-name}.mp3
   ```

3. The location will automatically be accessible at:
   ```
   https://your-github-pages-url/{location-name}
   ```

## Adding MP3 Files

MP3 files are excluded from the repository (via `.gitignore`) to keep the repository size small. To add audio files:

1. Clone the repository
2. Add your MP3 files to the `content/` directory
3. Deploy to GitHub Pages (the MP3 files will be uploaded during deployment)

Alternatively, you can:
- Host MP3 files on a CDN or external storage
- Update the `script.js` to point to external URLs

## QR Code Generation

For creating QR codes that link to your locations:

1. Use a QR code generator (e.g., https://qr-code-generator.com/)
2. Enter the full URL: `https://adrianjoshua-strutt.github.io/geschichte-f-r-alle/{location}`
3. Download and print the QR code

## Testing Locally

To test the site locally:

```bash
# Using Python 3
python3 -m http.server 8080

# Using Node.js
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

Then visit: `http://localhost:8080/`

## File Structure

```
.
├── index.html          # Main HTML page
├── styles.css          # Styling (green/white theme)
├── script.js           # Client-side routing logic
├── 404.html            # GitHub Pages routing handler
├── content/
│   ├── README.md       # Content directory documentation
│   ├── dom.txt         # Example: Dom content
│   ├── dom.mp3         # Example: Dom audio (not in repo)
│   ├── stadtschloss.txt
│   └── stadtschloss.mp3 (not in repo)
└── README.md           # This file
```

## Features

- ✅ Mobile-optimized responsive design
- ✅ Green and white university-style theme
- ✅ Client-side routing for clean URLs
- ✅ Text content display
- ✅ Optional audio player for MP3 files
- ✅ Easy to add new locations
- ✅ Perfect for QR code integration

## Browser Support

The application works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Changing Colors

Edit `styles.css` and modify the color values:
- Primary green: `#1a5a1a`
- Secondary green: `#2d7a2d`
- Background: `#ffffff`

### Changing Text

Edit the German text in `index.html` and `script.js` to customize messages.

## Support

For issues or questions, please open an issue on GitHub.
