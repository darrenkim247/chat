RustY - A Rust Chat Application
---
Live demonstration: https://einnuian.github.io/rust-y/

Set up OpenAIKey:
--
OpenAI API Key can be configured in .env file

Set up Shuttle.rs:
--
1. Install shuttle: https://docs.shuttle.rs/getting-started/installation
2. Create a shuttle account: https://www.shuttle.rs/
3. Go into the project repo and add the project to shuttle: **cargo shuttle project start**  
   (make sure the name of the project in Cargo.toml is unique)

Set up Google OAuth:
--
1. Create a new project on: https://console.cloud.google.com
2. Configure OAuth consent screen:
   - select external user. Fill in the app name and mandatory emails
   - scopes are optional
   - add test user(s)
3. Create credentials:
   - set the URIs to where your frontend is hosted
     
   <img src="https://github.com/user-attachments/assets/41e9af7c-9298-4766-b4c9-27849cff92ff" width=40% height=40%></img>
   <img src="https://github.com/user-attachments/assets/fda85bb2-8266-42f5-9972-a81f543ff995" width=40% height=40%></img>
   - **SAVE YOUR CLIENT ID AND SECRET!!**
4. Back in React, add your client ID to *Login.jsx*:
   ```
   client_id: "<your-client-id>",
   ```

Run locally: 
--
1. In the main directory:
   ```
   cargo shuttle run
   ```
2. Set "API_BASE_URL" in *App.jsx* to relative:
   ```
   API_BASE_URL = "";
   ```
3. In *chat_react_jsx*:
   ```
   npm run build
   npm run dev
   ```

Deploy on Shuttle and GitHub Pages:
--
1. Deploy backend (**--allow-dirty** allows deploying with uncommitted git changes):
   ```
   cargo shuttle deploy --allow-dirty
   ```
2. Install ```gh-pages```:
   ```
   npm install gh-pages --save-dev
   ```
3. Add "homepage" to *package.json*:
   ```
   "homepage": "https://<your-username>.github.io/<your-repo-name>"
   ```
   and "base" to *vite.config.js*:
   ```
   export default defineConfig({
    plugins: [react()],
    base: "/<your-repo-name/"
   })
   ```
4. Set "API_BASE_URL" in *App.jsx*:
   ```
   API_BASE_URL = "<your-backend-url>";
   ```
5. On Google OAuth, set Authorized JavaScript origins to:
   ```
   https://<your-username>.github.io
   ```
   and Authorized redirect URIs to :
   ```
   https://<your-username>.github.io/<your-repo-name>
   ```
6. Deploy frontend:
   ```
   npm run deploy
   ```
