import permissions from "../utils/permissions.js";

const roleMiddleware = (action) => {
  return (req, res, next) => {
    const userRole = req.user.role; //the role should be upload from auth middleware

    if (permissions[userRole] && permissions[userRole][action]) {
      return next();
    } else {
      return res
        .status(403)
        .json({ message: "Forbidden.You do not have permission be here" });
    }
  };
};

export default roleMiddleware;
