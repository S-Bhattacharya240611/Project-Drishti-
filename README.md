<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e4f679db-7a07-43fc-8162-f31bce5ee21e

## Deployment

This project is configured to automatically deploy to GitHub Pages via GitHub Actions.
To enable this:
1. Go to your repository settings on GitHub.
2. Navigate to **Pages** in the sidebar.
3. Under **Build and deployment**, change the **Source** from "Deploy from a branch" to **GitHub Actions**.
4. The site will then automatically build and deploy whenever you push to the `main` branch.


**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
