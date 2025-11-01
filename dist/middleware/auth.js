import jwt from "jsonwebtoken";
// Authentication middleware
export const isAuthenticated = (req, res, next) => {
    // Correct return type as void
    try {
        const token = 
        // req.body.token ||
        req.header("Authorization")?.replace("Bearer ", "");
        // console.log("Authorization header:", req.header("Authorization"));
        console.log("Extracted token:", token);
        // console.log("token in authantication", token);
        if (!token) {
            res.status(400).json({
                success: false,
                message: "Token not found token de bhai",
            });
            return; // Use return here to exit the function without returning the response object
        }
        // console.log("token in authantication", token);
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            throw new Error("JWT secret is not defined");
        }
        const payload = jwt.verify(token, JWT_SECRET);
        // console.log("payload in authantication", payload);
        // Check if payload is of type JwtPayload
        if (typeof payload === "object") {
            req.user = payload;
        }
        next();
    }
    catch (error) {
        console.error("Error during authentication:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while verifying the token",
            // error: (error as Error).message,
        });
        return; // Use return to exit the function here too
    }
};
export const isAdmin = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        // console.log("user in is admin", user);
        // Check if the user is an admin
        console.log("user.role in middlerware", user.role);
        if (user.role !== "ADMIN") {
            res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource",
            });
        }
        // console.log("welecom to admin");
        next();
    }
    catch (error) {
        console.error("Error during admin check:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while checking admin status",
        });
    }
};
export const isDistrictUser = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        // console.log("user in is admin", user);
        // Check if the user is an admin
        console.log("user.role in middlerware", user.role);
        if (user.role !== "DISTRICT_USER") {
            res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource",
            });
        }
        // console.log("welecom to admin");
        next();
    }
    catch (error) {
        console.error("Error during admin check:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while checking admin status",
        });
    }
};
export const isVIDHANSABHA_USER = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        // console.log("user in is admin", user);
        // Check if the user is an admin
        console.log("user.role in middlerware", user.role);
        if (user.role !== "VIDHANSABHA_USER") {
            res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource",
            });
        }
        // console.log("welecom to admin");
        next();
    }
    catch (error) {
        console.error("Error during admin check:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while checking admin status",
        });
    }
};
