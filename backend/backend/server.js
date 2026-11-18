import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/UserRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true
}));
app.use((req, res, next) => {
    const isWriteRequest = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const origin = req.get("origin");
    if (isWriteRequest && origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ message: "Request origin is not allowed." });
    }
    return next();
});
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({ message: "Task Management API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Page not found" });
});
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
            throw new Error("JWT_SECRET must be set to a unique secret of at least 32 bytes.");
        }
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exitCode = 1;
    }
};

startServer();

