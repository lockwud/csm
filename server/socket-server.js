/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("node:http");

const server = http.createServer((request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: true, service: "sankofa-socket-server" }));
});

const port = Number(process.env.SOCKET_PORT || 3001);
server.listen(port, () => {
  console.log(`Sankofa realtime server listening on http://localhost:${port}`);
});
