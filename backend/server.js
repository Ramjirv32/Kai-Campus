import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { corsOptions } from "./config/security.js";
import { seedUsers } from "./seed/seed.js";
import { initVectorStore } from "./utils/vectorStore.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import vipRoutes from "./routes/vipRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 7000;

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect DB and Seed
// Connect DB and Seed
connectDB()
  .then(async () => {
    await seedUsers();
    await initVectorStore();
    console.log('✅ AI Vector Store Initialized');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Kai Campus API is running...",
    version: "1.0.0"
  });
});

// Route Definitions
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/vip", vipRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`🚀 Kai Campus Server running at http://localhost:${port}`);
});

export default app;
