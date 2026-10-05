// Raíz de composición: único lugar donde se conectan repositorios, casos de uso y controllers.

const UserRepository = require('./infrastructure/repositories/UserRepository');
const ProductRepository = require('./infrastructure/repositories/ProductRepository');
const SaleRepository = require('./infrastructure/repositories/SaleRepository');

const RegisterUser = require('./application/use-cases/auth/RegisterUser');
const LoginUser = require('./application/use-cases/auth/LoginUser');

const GetUsers = require('./application/use-cases/users/GetUsers');
const GetUserById = require('./application/use-cases/users/GetUserById');
const UpdateUser = require('./application/use-cases/users/UpdateUser');
const DeleteUser = require('./application/use-cases/users/DeleteUser');

const CreateProduct = require('./application/use-cases/products/CreateProduct');
const GetProducts = require('./application/use-cases/products/GetProducts');
const GetProductById = require('./application/use-cases/products/GetProductById');
const UpdateProduct = require('./application/use-cases/products/UpdateProduct');
const DeleteProduct = require('./application/use-cases/products/DeleteProduct');

const CreateSale = require('./application/use-cases/sales/CreateSale');
const GetSales = require('./application/use-cases/sales/GetSales');
const GetSaleById = require('./application/use-cases/sales/GetSaleById');
const UpdateSale = require('./application/use-cases/sales/UpdateSale');
const DeleteSale = require('./application/use-cases/sales/DeleteSale');

const AuthController = require('./interfaces/controllers/AuthController');
const UserController = require('./interfaces/controllers/UserController');
const ProductController = require('./interfaces/controllers/ProductController');
const SaleController = require('./interfaces/controllers/SaleController');

const userRepository = new UserRepository();
const productRepository = new ProductRepository();
const saleRepository = new SaleRepository();

const getUserById = new GetUserById(userRepository);

const authController = new AuthController({
    registerUser: new RegisterUser(userRepository),
    loginUser: new LoginUser(userRepository),
    getUserById
});

const userController = new UserController({
    getUsers: new GetUsers(userRepository),
    getUserById,
    updateUser: new UpdateUser(userRepository),
    deleteUser: new DeleteUser(userRepository)
});

const productController = new ProductController({
    createProduct: new CreateProduct(productRepository),
    getProducts: new GetProducts(productRepository),
    getProductById: new GetProductById(productRepository),
    updateProduct: new UpdateProduct(productRepository),
    deleteProduct: new DeleteProduct(productRepository)
});

const saleController = new SaleController({
    createSale: new CreateSale(saleRepository),
    getSales: new GetSales(saleRepository),
    getSaleById: new GetSaleById(saleRepository),
    updateSale: new UpdateSale(saleRepository),
    deleteSale: new DeleteSale(saleRepository)
});

module.exports = { authController, userController, productController, saleController };
