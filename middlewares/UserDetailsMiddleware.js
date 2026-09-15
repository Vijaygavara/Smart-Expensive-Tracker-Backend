import jwt from "jsonwebtoken";
import User from "../models/UserDetails.js";

const authMiddleware = async (req, res, next) => {
  try {
    // console.log("authMiddleware called",req);
    const authHeader = req.headers.authorization;
    console.log("authHeader",authHeader);

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization header",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // // Check token version
    // if (decoded.tokenVersion !== user.tokenVersion) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Token has been invalidated",
    //   });
    // }
//     console.log("DB sessionId:", user.sessionId);
// console.log("JWT sessionId:", decoded.sessionId);
    
    if (user.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: "Session has been invalidated",
      });
    }

    // Attach user information to request
    req.user = decoded;

    next();
  } catch (error) {
    // console.log(error);

    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

export default authMiddleware;