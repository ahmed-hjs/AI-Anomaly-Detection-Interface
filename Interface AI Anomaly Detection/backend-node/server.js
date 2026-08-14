require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const sensorRoutes = require("./routes/sensorRoutes");
const alertRoutes = require("./routes/alertRoutes");
const demoRoutes = require("./routes/demoRoutes");
const aiRoutes = require("./routes/aiRoutes");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/sensors", sensorRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/ai", aiRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "backend-node" }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`[socket] client connecté : ${socket.id}`);
  socket.on("disconnect", () => console.log(`[socket] client déconnecté : ${socket.id}`));
});

// Pas de simulateur au démarrage : les données viennent soit du robot réel
// (POST /api/sensors/ingest, voir sensor_reader.py), soit du mode démo
// (POST /api/demo/start, qui rejoue backend-node/data/database.txt).

server.listen(PORT, () => {
  console.log(`backend-node à l'écoute sur http://localhost:${PORT}`);
});
