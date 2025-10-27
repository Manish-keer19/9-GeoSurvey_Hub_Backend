// import express from "express"
// import { authRouter } from "./router/auth.route.js";
// import fileUpload from "express-fileupload";
// import { eventRoute } from "./router/event.route.js";
// import cors from "cors";
// import {startCronJobs} from "./crons/cronJobs.js"
// import { adminRoute } from "./router/admin.route.js";
// const app = express();
// const PORT = 3000;
// app.use(express.json());
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );
// // Define CORS options based on environment variables
// const corsOptions = {
//   // origin: process.env.CORS_ORIGIN || '*',  // Allow all origins by default if CORS_ORIGIN is not defined
//   origin: "*", // Allow all origins by default if CORS_ORIGIN is not defined
//   methods: "GET, POST, PUT, DELETE", // Allowed HTTP methods
//   allowedHeaders: "Content-Type, Authorization", // Allowed headers
//   credentials: true, // Allow credentials (cookies, authorization headers)
// };
// // Apply CORS middleware with options
// app.use(cors(corsOptions));
// app.use("/api/admin",adminRoute)
// app.use("/api/auth",authRouter);
// app.use("/api/event",eventRoute);
// app.get('/', (req: any, res: any) => {
//   res.send('Hello World!');
// });
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
import express from "express";
import { authRouter } from "./router/auth.route.js";
import fileUpload from "express-fileupload";
import { eventRoute } from "./router/event.route.js";
import cors from "cors";
import { startCronJobs } from "./crons/cronJobs.js";
import { adminRoute } from "./router/admin.route.js";
import prisma from "./prisma.js"; // <-- import prisma
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
}));
// Define CORS options
const corsOptions = {
    origin: "*",
    methods: "GET, POST, PUT, DELETE",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
};
app.use(cors(corsOptions));
app.use("/api/admin", adminRoute);
app.use("/api/auth", authRouter);
app.use("/api/event", eventRoute);
app.get("/", (req, res) => {
    res.send("Hello World!");
});
// ✅ Start server after Prisma connects
async function startServer() {
    try {
        await prisma.$connect(); // <-- Connect once
        console.log("✅ Prisma connected");
        startCronJobs(); // Cron jobs can safely use Prisma now
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1); // Exit if Prisma cannot connect
    }
}
startServer();
