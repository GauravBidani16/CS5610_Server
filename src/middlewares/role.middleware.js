import { ApiError } from "../utils/index.js";

const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "Access denied. Higher level role is required to access this feauture."
      );
    }
    next();
  };
};

export default authorizeRole;
