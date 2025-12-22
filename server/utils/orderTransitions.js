export const orderTransitions = {
  pending: {
    edit: {
      nextStatus: "pending",
      allowedRoles: ["admin", "user", "client"],
    },
    cancel: {
      nextStatus: "cancelled",
      allowedRoles: ["admin", "user", "client"],
    },
    complete: {
      nextStatus: "completed",
      allowedRoles: ["admin"],
    },
  },

  completed: {
    edit: { nextStatus: null, allowedRoles: [] },
    cancel: { nextStatus: null, allowedRoles: [] },
    complete: { nextStatus: null, allowedRoles: [] },
  },

  cancelled: {
    edit: { nextStatus: null, allowedRoles: [] },
    cancel: { nextStatus: null, allowedRoles: [] },
    complete: { nextStatus: null, allowedRoles: [] },
  },
};

export const canPerformAction = (currentStatus, action, role) => {
  const statusObj = orderTransitions[currentStatus];
  if (!statusObj) return false;

  const actionObj = statusObj[action];
  if (!actionObj) return false;

  return actionObj.allowedRoles.includes(role);
};

export const getNextStatus = (currentStatus, action) => {
  const statusObj = orderTransitions[currentStatus];
  if (!statusObj) return null;

  const actionObj = statusObj[action];
  if (!actionObj) return null;

  return actionObj.nextStatus;
};
