╔══════════════════════════════════════════╗
║   ⚡ KIRTI-MD - Setup Guide (Simple)   ║
╚══════════════════════════════════════════╝

STEP 1: Telegram Bot Token lo (ek baar hi)
  1. Telegram kholo, search karo "BotFather"
  2. /newbot bhejo, naam do (jaise "Kirti MD Bot")
  3. Wo tumhe ek token dega jaisa: 8803157269:AAG6DN...
  4. .env file kholo, TELEGRAM_BOT_TOKEN= ke aage wo token paste karo

STEP 2: Install
  npm install

STEP 3: Start
  npm start

STEP 4: Connect WhatsApp
  1. Apna Telegram bot kholo (jo BotFather se banaya)
  2. /start karo
  3. WhatsApp number type karo (jaise 917086852797)
  4. Pairing code Telegram pe aayega
  5. WhatsApp > Settings > Linked Devices > Link with phone number > Code daalo
  6. Bot connected! WhatsApp mein khud ko *.menu* bhejo

FEATURES:
🤖 .menu / .owner / .ping / .alive — Main commands
🎵 .song <naam ya link> — YouTube se gaana download
🎙️ .voice <effect> — Reply karke voice badlo
   (deep, chipmunk, robot, deman, fast, slow, echo, reverse)

Koi website/panel nahi hai — bas ye 3 files: index.js, package.json, .env
