const permissions = {
  admin: {
    orders: true, // admin μπορεί όλα τα orders
    sales: true, // admin μπορεί όλα τα sales
    users: true, // διαχείριση users
    products: true, // διαχείριση products
  },

  user: {
    orders: true, // βλέπει μόνο δικά του (controller αποφασίζει ownership)
    sales: true, // δημιουργεί και βλέπει μόνο δικά του sales
    users: false, // δεν μπορεί να διαχειριστεί users
    products: true, // δεν μπορεί να διαχειριστεί products
  },

  client: {
    orders: true, // βλέπει μόνο δικά του orders
    sales: false, // δεν έχει πρόσβαση σε sales
    users: false, // δεν μπορεί να διαχειριστεί users
    products: false, // δεν μπορεί να διαχειριστεί products
  },
};

export default permissions;
