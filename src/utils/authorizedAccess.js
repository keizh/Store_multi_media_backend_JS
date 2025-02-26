import jwt from "jsonwebtoken";

const authorizedAccess = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(400).json({ message: "NO TOKEN" });
    return;
  }

  if (!process.env.SECRET_KEY) {
    res.status(500).json({ message: "SERVER_CONFIGURATION_ERROR" });
    return;
  }

  try {
    const decoded = jwt.verify(authorization, process.env.SECRET_KEY ?? "");

    if (!decoded.userId || !decoded.email) {
      res.status(401).json({ message: "INVALID_TOKEN_PAYLOAD" });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    // Irrespective of err being instance of jwt.TokenExpiredError & jwt.JsonWebTokenError
    res.status(401).json({ message: "JWT_ERROR" });
    return;
  }
};

export default authorizedAccess;
