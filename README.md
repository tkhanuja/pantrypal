<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/50d5c7a3-c7a4-4b0d-ac5e-8abe633050a0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm start`


run build: 
npm run build 
npm start


build container:
gcloud builds submit --tag gcr.io/pantry-pal-66ed8/pantry-pal .

deploy image : 

gcloud run deploy pantry-pal \                             
  --image gcr.io/pantry-pal-66ed8/pantry-pal \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --timeout=300s


ALT: deploy via github 

git push origin main