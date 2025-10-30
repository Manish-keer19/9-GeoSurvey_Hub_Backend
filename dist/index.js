import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import prisma from "./prisma.js";
import { discrictRoute } from "./router/discrict.route.js";
// import updateBlocks from "./config/updateblocks.utils.js";
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
app.use("/api/v1/districts", discrictRoute);
app.get("/", (req, res) => {
    res.send("Hello World!");
});
// ✅ Start server after Prisma connects
async function startServer() {
    try {
        await prisma.$connect(); // <-- Connect once
        // await updateBlocks();
        console.log("✅ Prisma connected");
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
