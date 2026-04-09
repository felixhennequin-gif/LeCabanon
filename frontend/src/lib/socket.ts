import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No token");

  socket = io(window.location.origin, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.on("connect_error", async (err) => {
    if (err.message === "Invalid token") {
      // Try refreshing token
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          socket!.auth = { token: data.accessToken };
          socket!.connect();
        }
      } catch { /* ignore */ }
    }
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
