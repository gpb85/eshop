const permissions = {
  admin: {
    createOrder: false,
    createSale: false,
    manageSales: true,
    manageOrders: true,
    manageProducts: true,
    manageUsers: true,
    cancelSale: true,
  },

  user: {
    createOrder: false,
    createSale: true,
    manageSales: true,
    manageOrders: false,
    manageProducts: false,
    cancelSale: true,
  },

  client: {
    createOrder: true,
    viewOwnOrders: true,
    cancelOrders: true,
    createSale: false,
    manageSales: false,
    manageOrders: false,
    manageProducts: false,
    cancelSale: false,
  },
};

export default permissions;
