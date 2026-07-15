/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { createHmac, timingSafeEqual } = require("node:crypto");

const SOCKET_PORT = Number(process.env.SOCKET_PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret-change-me";

function verifySession(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "sankofa-socket-server" }));
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const token = socket.handshake.query.token;
  const session = verifySession(token);

  if (!session) {
    socket.disconnect(true);
    return;
  }

  socket.data.session = session;

  if (session.riderId) {
    const room = `rider:${session.riderId}`;
    socket.join(room);
    socket.join(`user:${session.sub}`);
  }

  socket.on("rider:subscribe", ({ riderId }) => {
    if (!riderId || typeof riderId !== "string") return;
    const room = `rider:${riderId}`;
    socket.join(room);
    socket.join(`tracker:${riderId}`);
  });

  socket.on("rider:unsubscribe", ({ riderId }) => {
    if (!riderId || typeof riderId !== "string") return;
    socket.leave(`rider:${riderId}`);
    socket.leave(`tracker:${riderId}`);
  });

  socket.on("rider:location", ({ latitude, longitude, note }) => {
    const riderId = socket.data.session?.riderId;
    if (!riderId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const payload = { riderId, latitude, longitude, note: note || null, updatedAt: new Date().toISOString() };
    io.to(`rider:${riderId}`).emit("location:update", payload);
  });

  socket.on("disconnect", () => {
    const riderId = socket.data.session?.riderId;
    if (riderId) {
      socket.leave(`rider:${riderId}`);
      socket.leave(`user:${socket.data.session.sub}`);
    }
  });
});

httpServer.listen(SOCKET_PORT, () => {
  console.log(`Sankofa realtime server listening on http://localhost:${SOCKET_PORT}`);
});
