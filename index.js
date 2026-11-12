// ╔══════════════════════════════════════════╗
// ║        ⚡ LAILA-MD — SIMPLE BOT ⚡         ║
// ║      👑 Developed by MAJNU            ║
// ╚══════════════════════════════════════════╝
// Ek hi file mein poora bot — koi website/panel nahi. Pairing Telegram se hoti hai.

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');
const TelegramBot = require('node-telegram-bot-api');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const yts = require('yt-search');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);
const crypto = require('crypto');

const AX = { timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': '*/*' } };

function detectAudioFormat(buf) {
    if (!buf || buf.length < 12) return 'mp3';
    const hex = buf.slice(0, 4).toString('hex');
    const ftyp = buf.slice(4, 8).toString('ascii');
    if (ftyp === 'ftyp') return 'm4a';
    if (buf.slice(0, 4).toString('ascii') === 'OggS') return 'ogg';
    if (buf.slice(0, 4).toString('ascii') === 'RIFF') return 'wav';
    if (hex === '1a45dfa3') return 'webm';
    return 'mp3';
}

async function toAudio(buffer, ext) {
    const id = crypto.randomBytes(8).toString('hex');
    const inputPath = path.join(TMP, `${id}_in.${ext}`);
    const outputPath = path.join(TMP, `${id}_out.mp3`);
    try {
        fs.writeFileSync(inputPath, buffer);
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath).toFormat('mp3').on('end', resolve).on('error', reject).save(outputPath);
        });
        return fs.readFileSync(outputPath);
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
}

// ── CONFIG ──────────────────────────────────────────
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_TG_ID = process.env.OWNER_TG_ID || ''; // Telegram security ke liye
const OWNER_NUMBER = process.env.OWNER_NUMBER || '9104688604';
const WA_GROUP = 'https://chat.whatsapp.com/KWtZiJGNq11IvVuok7dI0n?s=cl&p=a&mlu=4&ilr=4&iam=2';
const YT_CHANNEL = 'https://www.instagram.com/skyyy_editz7?cplk=MWQ5M3prY3FyNTd1Ng==';
const BOT_IMG = 'https://i.ibb.co/mFv1DLwx/127414.png';

if (!TG_TOKEN) {
    console.log('❌ .env mein TELEGRAM_BOT_TOKEN daalo! (BotFather se banao)');
    process.exit(1);
}

const tgBot = new TelegramBot(TG_TOKEN, { polling: true });
const sessions = {};

['sessions', 'tmp'].forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));
const TMP = path.join(__dirname, 'tmp');
fs.readdirSync(TMP).forEach(f => fs.unlinkSync(path.join(TMP, f)));


const HEADER = `┏━━━⪩ *L A I L A* ⪨━━━┓
┃  ⚡ 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 𝗪𝗔 𝗕𝗢𝗧 ⚡
┃  👑 Developed by MAJNU
┗━━━━━━━━━━━━━━━━━━━━━━┛`;
const FOOTER = `\n╭───────────────╮\n│ 👑 *GENIUS HACKER MAJNU*\n│ 🔗 ${YT_CHANNEL}\n╰───────────────╯`;

const MENU_MSG = `${HEADER}

✨ *__Available Commands__* ✨

╭─❐ 🤖 *MAIN*
│ ➤ *.menu* — Ye menu
│ ➤ *.owner* — Owner contact
│ ➤ *.ping* — Speed check
│ ➤ *.alive* — Bot alive check
╰────────────

╭─❐ 🎵 *DOWNLOAD*
│ ➤ *.song* <naam/link>
│    YouTube se gaana download
│ ➤ *.ytv* <naam/link>
│    YouTube se video download
╰────────────

╭─❐ 🎙️ *VOICE CHANGER*
│ ➤ *.voice* <effect>
│    reply karke voice badlo
│
│  • deep      • chipmunk
│  • robot     • deman
│  • fast      • slow
│  • echo      • reverse
╰────────────
${FOOTER}`;

const VOICE_FILTERS = {
    deep: 'asetrate=44100*0.8,aresample=44100,atempo=1.15',
    chipmunk: 'asetrate=44100*1.5,aresample=44100,atempo=0.85',
    robot: 'afftdn=nr=10,flanger=delay=0:depth=2:speed=0.5,vibrato=f=8:d=0.9',
    deman: 'asetrate=44100*0.7,aresample=44100,atempo=1.3,bass=g=6',
    fast: 'atempo=1.6',
    slow: 'atempo=0.7',
    echo: 'aecho=0.8:0.9:60:0.4',
    reverse: 'areverse'
};

// ── SONG DOWNLOAD ───────────────────────────────────
async function songDownload(sock, from, msg, query) {
    if (!query) {
        await sock.sendMessage(from, { text: `❌ Song ka naam do bhai.\n*Example:* .song Tum Hi Ho` }, { quoted: msg });
        return;
    }
    try {
        let ytUrl = query, title = query, thumb = BOT_IMG, duration = '';
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            const res = await yts(query);
            if (!res?.videos?.length) return sock.sendMessage(from, { text: `❌ "${query}" nahi mila.` }, { quoted: msg });
            const v = res.videos[0];
            ytUrl = v.url; title = v.title; thumb = v.thumbnail; duration = v.timestamp || '';
        }

        await sock.sendMessage(from, {
            image: { url: thumb || BOT_IMG },
            caption: `🎵 *Downloading:* ${title}\n⏱ ${duration}\n⏳ Wait karo...${FOOTER}`
        }, { quoted: msg });

        const songApis = [
            { url: `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(ytUrl)}&format=mp3`,
              parse: d => ({ dl: d?.downloadURL, title: d?.title }) },
            { url: `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(ytUrl)}`,
              parse: d => ({ dl: d?.result?.download?.url, title: d?.result?.metadata?.title }) },
            { url: `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}`,
              parse: d => ({ dl: d?.data?.download_url, title: d?.data?.title }) },
            { url: `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}`,
              parse: d => ({ dl: d?.dl, title: d?.title }) },
            { url: `https://api.alyachan.pro/api/ytmp3?url=${encodeURIComponent(ytUrl)}&apikey=G7I6X7`,
              parse: d => ({ dl: d?.data?.url, title: d?.data?.title }) },
        ];

        let dlUrl = null, finalTitle = title;
        for (const api of songApis) {
            try {
                const r = await axios.get(api.url, { ...AX, timeout: 30000 });
                const parsed = api.parse(r.data);
                console.log(`[SONG API] ${api.url.split('?')[0]} → status ${r.status}, dl found: ${!!parsed?.dl}`);
                if (parsed?.dl) { dlUrl = parsed.dl; finalTitle = parsed.title || title; break; }
            } catch (e) {
                console.log(`[SONG API FAILED] ${api.url.split('?')[0]} → ${e.response?.status || e.code || e.message}`);
            }
        }
        if (!dlUrl) return sock.sendMessage(from, { text: `❌ Download nahi hua. Dusra naam try karo.` }, { quoted: msg });

        const audioRes = await axios.get(dlUrl, { ...AX, responseType: 'arraybuffer', timeout: 120000 });
        let audioBuf = Buffer.from(audioRes.data);
        const ext = detectAudioFormat(audioBuf);
        if (ext !== 'mp3') {
            try { audioBuf = await toAudio(audioBuf, ext); } catch (e) { console.log('Convert error:', e.message); }
        }

        const safeName = finalTitle.replace(/[^\w\s-]/g, '').trim() || 'song';
        await sock.sendMessage(from, { audio: audioBuf, mimetype: 'audio/mpeg', fileName: `${safeName}.mp3` }, { quoted: msg });
        await sock.sendMessage(from, { text: `✅ *${finalTitle}*${FOOTER}` });
    } catch (e) {
        console.log('Song error:', e.message);
        await sock.sendMessage(from, { text: `❌ Download nahi hua: ${e.message}` }, { quoted: msg });
    }
}

// ── YOUTUBE VIDEO DOWNLOAD ──────────────────────────
async function ytVideoDownload(sock, from, msg, query) {
    if (!query) {
        await sock.sendMessage(from, { text: `❌ YouTube link ya naam do bhai.\n*Example:* .ytv Alan Walker Faded` }, { quoted: msg });
        return;
    }
    try {
        let ytUrl = query, title = query, thumb = BOT_IMG;
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            const res = await yts(query);
            if (!res?.videos?.length) return sock.sendMessage(from, { text: `❌ Video nahi mila!` }, { quoted: msg });
            const v = res.videos[0];
            ytUrl = v.url; title = v.title; thumb = v.thumbnail;
        }

        await sock.sendMessage(from, {
            image: { url: thumb },
            caption: `🎬 *Downloading:* ${title}\n⏳ Wait karo...${FOOTER}`
        }, { quoted: msg });

        const videoApis = [
            `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(ytUrl)}&format=mp4`,
            `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(ytUrl)}`,
            `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}`
        ];

        let dlUrl = null, finalTitle = title;
        for (const apiUrl of videoApis) {
            try {
                const r = await axios.get(apiUrl, { ...AX, timeout: 30000 });
                const d = r.data;
                const url = d?.downloadURL || d?.result?.download?.url || d?.dl;
                if (url) { dlUrl = url; finalTitle = d?.title || d?.result?.metadata?.title || title; break; }
            } catch (e) { /* try next */ }
        }
        if (!dlUrl) return sock.sendMessage(from, { text: `❌ Video download nahi hua!\nYouTube link directly try karo.` }, { quoted: msg });

        await sock.sendMessage(from, {
            video: { url: dlUrl },
            caption: `✅ *${finalTitle}*${FOOTER}`,
            mimetype: 'video/mp4'
        }, { quoted: msg });
    } catch (e) {
        console.log('Video error:', e.message);
        await sock.sendMessage(from, { text: `❌ Video download nahi hua: ${e.message}` }, { quoted: msg });
    }
}

// ── VOICE CHANGER ───────────────────────────────────
async function voiceChange(sock, from, msg, quoted, effect) {
    effect = (effect || 'deep').toLowerCase();
    if (!VOICE_FILTERS[effect]) {
        return sock.sendMessage(from, {
            text: `❌ Effect galat hai. Available:\n\n${Object.keys(VOICE_FILTERS).map(e => `• ${e}`).join('\n')}\n\nReply kisi voice-note par: *.voice <effect>*`
        }, { quoted: msg });
    }
        if (!quoted || quoted.mtype !== 'audioMessage') {
        return sock.sendMessage(from, { text: `❌ Sirf kisi *voice note ya audio* ko reply karke bhejo.\n*Example:* .voice ${effect}` }, { quoted: msg });
    }

    let inPath, outPath;
    try {
        const stream = await downloadContentFromMessage(quoted, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        inPath = path.join(TMP, `vc_in_${Date.now()}.ogg`);
        outPath = path.join(TMP, `vc_out_${Date.now()}.opus`);
        fs.writeFileSync(inPath, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inPath).audioFilters(VOICE_FILTERS[effect]).format('opus').audioCodec('libopus')
                .save(outPath).on('end', resolve).on('error', reject);
        });

        await sock.sendMessage(from, { audio: fs.readFileSync(outPath), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
    } catch (e) {
        console.log('Voice error:', e.message);
        await sock.sendMessage(from, { text: `❌ Voice change nahi hua: ${e.message}` }, { quoted: msg });
    } finally {
        if (inPath && fs.existsSync(inPath)) fs.unlinkSync(inPath);
        if (outPath && fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }
}

// ── WHATSAPP SESSION ────────────────────────────────
class Session {
    constructor(chatId) {
        this.chatId = chatId;
        this.authPath = path.join(__dirname, 'sessions', chatId);
        this.sock = null;
        fs.mkdirSync(this.authPath, { recursive: true });
    }
    async start(phone) {
        const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
        let version = [2, 3000, 1015901307];
        try { const v = await fetchLatestBaileysVersion(); version = v.version; } catch (e) {}
        this.sock = makeWASocket({ version, auth: state, printQRInTerminal: false, logger: pino({ level: 'silent' }) });
        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'open') {
                await tgBot.sendMessage(this.chatId, `✅ *LAILA-MD CONNECTED!*\n\n⚡ Bot ready hai!\n📋 Type *.menu* in WhatsApp`, { parse_mode: 'Markdown' });
                await this.sock.sendMessage(this.sock.user.id, { text: `${HEADER}\n\n✅ *Bot connected!*\n📋 Type *.menu* to see commands${FOOTER}` });
            }
            if (connection === 'close') {
                const logout = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
                if (!logout) setTimeout(() => this.start(null), 5000);
                else {
                    await tgBot.sendMessage(this.chatId, '❌ Logout ho gaya! Dobara number bhejo.');
                    fs.rmSync(this.authPath, { recursive: true, force: true });
                    delete sessions[this.chatId];
                }
            }
        });

        if (phone && !this.sock.authState.creds.registered) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const code = await this.sock.requestPairingCode(phone);
                await tgBot.sendMessage(this.chatId,
                    `🔑 *PAIRING CODE:*\n\n\`${code}\`\n\n*WhatsApp mein:*\nSettings ▶ Linked Devices ▶ Link a Device ▶ Link with phone number ▶ Code daalo`,
                    { parse_mode: 'Markdown' });
            } catch (e) {
                await tgBot.sendMessage(this.chatId, `❌ Error: ${e.message}`);
            }
        }

        this.sock.ev.on('messages.upsert', async ({ messages }) => {
                        for (const msg of messages) {
                try {
                    if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;
                    const from = msg.key.remoteJid;
                    const isGroup = from.endsWith('@g.us');
                    const sender = isGroup ? msg.key.participant : from;
                    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                    const cmd = text.trim();
                    const cmdL = cmd.toLowerCase();
                    const S = this.sock;
                    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                        ? { message: msg.message.extendedTextMessage.contextInfo.quotedMessage, mtype: Object.keys(msg.message.extendedTextMessage.contextInfo.quotedMessage)[0] }
                        : null;
                    const quotedForDownload = quoted ? { ...quoted.message[quoted.mtype], mtype: quoted.mtype } : null;

                    if (cmdL === '.menu' || cmdL === '.help') {
                        await S.sendMessage(from, { image: { url: BOT_IMG }, caption: MENU_MSG }, { quoted: msg });
                    } else if (cmdL === '.owner') {
                        const num = '+' + OWNER_NUMBER;
                        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:majnu\nORG:LAILA-MD;\nTEL;type=CELL;type=VOICE;waid=${OWNER_NUMBER}:${num}\nEND:VCARD`;
                        await S.sendMessage(from, { contacts: { displayName: 'majnu', contacts: [{ vcard }] } }, { quoted: msg });
                        await S.sendMessage(from, { text: `╭─❐ 👑 *OWNER INFO*\n│ ➤ *Name:* majnu\n│ ➤ *Number:* ${num}\n╰────────────${FOOTER}` });
                    } else if (cmdL === '.ping' || cmdL === '.speed') {
                        const start = Date.now();
                        const sent = await S.sendMessage(from, { text: '⚡ Pinging...' }, { quoted: msg });
                        await S.sendMessage(from, { text: `⚡ *PING:* ${Date.now() - start}ms${FOOTER}`, edit: sent.key });
                    } else if (cmdL === '.alive' || cmdL === '.status') {
                        await S.sendMessage(from, {
                            image: { url: BOT_IMG },
                            caption: `${HEADER}\n\n╭─❐ 💚 *STATUS*\n│ ➤ *Alive:* ✅ Online\n│ ➤ *Uptime:* ${Math.floor(process.uptime() / 60)} min\n╰────────────${FOOTER}`
                        }, { quoted: msg });
                    } else if (cmdL.startsWith('.song') || cmdL.startsWith('.play')) {
                        const q = cmd.split(' ').slice(1).join(' ').trim();
                        await songDownload(S, from, msg, q);
                    } else if (cmdL.startsWith('.ytv') || cmdL.startsWith('.video')) {
                        const q = cmd.split(' ').slice(1).join(' ').trim();
                        await ytVideoDownload(S, from, msg, q);
                    } else if (cmdL.startsWith('.voice') || cmdL.startsWith('.vc')) {
                        const args = cmd.split(' ').slice(1);
                        await voiceChange(S, from, msg, quotedForDownload, args[0]);
                    }
                } catch (e) { console.log('Msg error:', e.message); }
            }
        });
    }
}

// ── TELEGRAM BOT (PAIRING) ──────────────────────────
tgBot.onText(/\/start/, async (msg) => {
    const id = msg.chat.id.toString();
    await tgBot.sendMessage(id,
`${HEADER}

🔗 ${YT_CHANNEL}
🔗 ${WA_GROUP}

*Connect karne ke liye number bhejo:*
Example: \`917086852797\`

*Features:*
🎵 Song Download (.song)
🎙️ Voice Changer (.voice)
🤖 Main commands (.menu, .owner, .ping, .alive)
${FOOTER}`, { parse_mode: 'Markdown' });
});

tgBot.on('message', async (msg) => {
    const id = msg.chat.id.toString();
    if (OWNER_TG_ID && id !== OWNER_TG_ID) {
        return tgBot.sendMessage(id, '❌ Ye bot private hai. Sirf owner hi connect kar sakta hai.');
    }
    const text = msg.text?.trim() || '';
    if (text.startsWith('/')) return;
    const phone = text.replace(/[^0-9]/g, '');
    if (phone.length < 10 || phone.length > 15) return;
    await tgBot.sendMessage(id, `⏳ *Connecting...*\nNumber: +${phone}\n\nCode 5 sec mein aayega...`, { parse_mode: 'Markdown' });
    if (!sessions[id]) sessions[id] = new Session(id);
    await sessions[id].start(phone);
});

// ── AUTO-RECONNECT EXISTING SESSIONS ────────────────
const SESSIONS_DIR = path.join(__dirname, 'sessions');
for (const chatId of fs.readdirSync(SESSIONS_DIR)) {
    if (!sessions[chatId]) {
        sessions[chatId] = new Session(chatId);
        sessions[chatId].start(null);
    }
}

console.log(`
${HEADER}
✅ Bot chalu hai! Telegram pe /start karo.
`);
