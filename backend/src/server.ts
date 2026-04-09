import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { setupSocket } from "./socket.js";

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
