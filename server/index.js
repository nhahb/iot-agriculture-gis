require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const route = require("./routes/index");
const { connectMqtt } = require("./mqtt/mqttClient");

const startHistoryAggregationJob = require("./jobs/historyAggregation");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ================= MIDDLEWARE =================

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================= ROUTES =================

route(app);

// ================= SOCKET.IO =================

const io = new Server(server, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("field:join", (fieldId) => {
    const parsedFieldId = Number(fieldId);

    if (!Number.isInteger(parsedFieldId) || parsedFieldId <= 0) {
      console.warn("Invalid field ID:", fieldId);
      return;
    }

    const room = `field:${parsedFieldId}`;

    socket.join(room);

    console.log(`${socket.id} joined ${room}`);
  });

  socket.on("field:leave", (fieldId) => {
    const parsedFieldId = Number(fieldId);

    if (!Number.isInteger(parsedFieldId) || parsedFieldId <= 0) {
      return;
    }

    const room = `field:${parsedFieldId}`;

    socket.leave(room);

    console.log(`${socket.id} left ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ================= MQTT =================

// Truyền io để MQTT có thể emit dữ liệu
connectMqtt(io);

// ================= START SERVER =================

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startHistoryAggregationJob();
});