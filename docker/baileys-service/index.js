/**
 * Baileys Multi-Device WhatsApp Gateway Microservice
 * Production-ready simulation of WhatsApp Web socket hook.
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const express = require("express");
const QRCode = require("qrcode");
const axios = require("axios");
const pino = require("pino");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://backend:8000/api/whatsapp/webhook";
const AUTH_DIR = path.join(__dirname, "baileys_auth_store");

let sock = null;
let currentQrBase64 = null;
let connectionStatus = "disconnected"; // disconnected, connecting, qr, connected

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: "info" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionStatus = "qr";
      // Generate QR base64
      currentQrBase64 = await QRCode.toDataURL(qr);
      console.log("=== WA QR CODE GENERATED, SCAN TO CONNECT ===");
    }

    if (connection === "close") {
      connectionStatus = "disconnected";
      currentQrBase64 = null;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed due to ", lastDisconnect?.error, ", reconnecting: ", shouldReconnect);
      if (shouldReconnect) {
        startWhatsApp();
      }
    } else if (connection === "open") {
      connectionStatus = "connected";
      currentQrBase64 = null;
      console.log("=== WHATSAPP GATEWAY CONNECTED SUCCESSFULLY ===");
      
      // Notify Laravel backend that WA is connected
      try {
        await axios.post(WEBHOOK_URL, {
          event: "connection.open",
          jid: sock.user.id,
          name: sock.user.name,
        });
      } catch (err) {
        console.error("Failed to deliver connection hook to Laravel:", err.message);
      }
    }
  });

  // Handle Incoming Messages
  sock.ev.on("messages.upsert", async (m) => {
    if (m.type === "notify") {
      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
          const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
          const sender = msg.pushName || msg.key.remoteJid;
          const phone = msg.key.participant || msg.key.remoteJid;

          console.log(`[New Message] From ${sender}: ${text}`);

          // Forward to Laravel backend for indexing & queuing AI analysis
          try {
            await axios.post(WEBHOOK_URL, {
              event: "messages.upsert",
              message: {
                id: msg.key.id,
                chatId: msg.key.remoteJid,
                isGroup: msg.key.remoteJid.endsWith("@g.us"),
                sender: sender,
                phone: phone,
                text: text,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (err) {
            console.error("Failed to forward message to Laravel:", err.message);
          }
        }
      }
    }
  });
}

// REST Endpoints for Laravel to call
app.get("/status", (req, res) => {
  res.json({
    status: connectionStatus,
    phone: sock?.user?.id || null,
    name: sock?.user?.name || null,
  });
});

app.get("/qr", (req, res) => {
  if (connectionStatus === "qr" && currentQrBase64) {
    res.json({ qr: currentQrBase64 });
  } else {
    res.json({ status: connectionStatus, qr: null });
  }
});

app.post("/send-message", async (req, res) => {
  const { to, text } = req.body;
  if (!sock || connectionStatus !== "connected") {
    return res.status(400).json({ error: "WhatsApp Gateway is not connected." });
  }
  try {
    await sock.sendMessage(to, { text: text });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

startWhatsApp();

app.listen(PORT, () => {
  console.log(`Baileys WhatsApp service listening on port ${PORT}`);
});
