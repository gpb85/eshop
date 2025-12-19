export const orderTransitions = {
  pending: {
    edit: {
      nextStatus: "pending",
      allowdRoles: ["admin", "user", "client"],
    },
    cancel: {
      cancel: {
        nextStatus: "cancelled",
        allowdRoles: ["client", "user", "admin"],
      },
    },
    complete: {
      complete: {
        nextStatus: "completed",
        allowdRoles: ["admin"],
      },
    },
    completed: {
      edit: { nextStatus: null, allowdRoles: [] },
      cancel: { nextStatus: null, allowdRoles: [] },
      complete: { nextStatus: null, allowdRoles: [] },
    },
    cancelled: {
      edit: { nextStatus: null, allowdRoles: [] },
      complete: { nextStatus: null, allowdRoles: [] },
      cancel: { nextStatus: null, allowdRoles: [] },
    },
  },
};

export const canPerformAction = (currentStatus, action, role) => {
  const statusObj = orderTransitions[currentStatus];
  if (!statusObj) return false;
  const actionObj = statusObj[action];
  if (!actionObj) return false;
  return actionObj.allowdRoles.includes(role);
};

export const getNextStatus = (currentStatus, action) => {
  const statusObj = orderTransitions[currentStatus];
  if (!statusObj) return false;
  const actionObj = statusObj(action);
  if (!actionObj) return false;
  return actionObj.nextStatus;
};
