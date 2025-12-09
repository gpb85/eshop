const permissions = {
  admin: {
    inviteUser: true,
    deleteUser: true,
    manageProducts: true,
    manageOrders: true,
    sellProducts: true,
    cancelSale: true,
  },
  user: {
    inviteUser: false,
    deleteUser: false,
    manageProducts: true,
    manageOrders: true,
    sellProducts: true,
    cancelSale: true,
  },
  client: {
    inviteUser: false,
    deleteUser: false,
    manageProducts: false,
    manageOrders: false,
    sellProducts: false,
    cancelSale: false,
  },
};

export default permissions;
