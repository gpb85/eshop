import permissions from "./../utils/permissions.js";

const roleMiddleware = (resource) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (!permissions[role] || !permissions[role][resource]) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
};

export default roleMiddleware;
