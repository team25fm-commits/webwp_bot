# WhatsApp Auto-Poster 🤖

Automated bot to post images from Google Drive to a WhatsApp Group with AI-generated captions.

## 📁 Project Structure
- `services/`: Core logic for Drive, Gemini, and WhatsApp.
- `config/`: Configuration settings.
- `logs/`: Application logs.
- `credentials.json`: **(You provide this)** Google Service Account Key.
- `.env`: **(You provide this)** API Keys and settings.

## 🚀 Setup Steps

### 1. Prerequisites
- Node.js installed (v18 or higher).
- Google Cloud Service Account JSON file.
- Gemini API Key.

### 2. Configuration
1.  Run `npm install` to install dependencies.
2.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
3.  Open `.env` and fill in your details:
    - `PENDING_FOLDER_ID`: ID of the Google Drive folder with images.
    - `DONE_FOLDER_ID`: ID of the folder where sent images will go.
    - `GEMINI_API_KEY`: Your AI Studio API key.
    - `WHATSAPP_GROUP_NAME` or `ID`.
4.  **Important**: Place your `credentials.json` file in the root of this folder.

### 3. First Run (Authentication)
Run the script manually to log in to WhatsApp:
```bash
npm run post-now
```
- A QR code will appear in the terminal.
- Scan it with your WhatsApp (Linked Devices).
- Once logged in, the bot will pick an image, generate a caption, and send it.
- **Success!** Your session is now saved in the `.wwebjs_auth` folder.

## ☁️ Deployment on Render.com

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-bot.git
git push -u origin main
```

### 2. Create Render Service
1. Go to [render.com](https://render.com) and create account
2. Click **New** → **Background Worker**
3. Connect your GitHub repo
4. Configure Build:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 3. Set Environment Variables
In Render Dashboard → Environment:

| Variable | Value |
|----------|-------|
| `PENDING_FOLDER_ID` | Your Drive Pending Folder ID |
| `DONE_FOLDER_ID` | Your Drive Done Folder ID |
| `GEMINI_API_KEY` | Your Gemini API Key |
| `WHATSAPP_GROUP_NAME` | Your Group Name |
| `GOOGLE_CREDENTIALS_JSON` | Paste entire credentials.json content |
| `TZ` | `Asia/Kolkata` |

### 4. WhatsApp Authentication Issue
> ⚠️ **Important:** WhatsApp requires QR scan which needs a display.
> For Render, you'll need to:
> 1. Run locally first to authenticate
> 2. Copy `.wwebjs_auth` folder content
> 3. Use persistent storage or alternative auth method

---

## Deployment on Oracle VPS (Alternative)VPS

### Step 1: Prepare Server
Connect to your VPS and install Node.js & dependencies:
```bash
# Update System
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Chrome Dependencies (Required for WhatsApp)
sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm1
```

### Step 2: Upload Files
Upload this project folder to your server (exclude `node_modules`).
**CRITICAL**: You MUST upload the `.wwebjs_auth` folder from your local machine to the server. This contains your login session.
```bash
# Example using SCP from your local machine
scp -r .wwebjs_auth ubuntu@YOUR_IP:~/whatsapp-bot/
scp -r .env credentials.json services config utils index.js package.json ubuntu@YOUR_IP:~/whatsapp-bot/
```

### Step 3: Run with PM2
On the server:
```bash
cd ~/whatsapp-bot
npm install
npm install -g pm2

# Start the bot
pm2 start index.js --name whatsapp-bot

# Save auto-restart
pm2 save
pm2 startup
```

## 🛠️ Monitoring
Check logs:
```bash
pm2 logs whatsapp-bot
```
