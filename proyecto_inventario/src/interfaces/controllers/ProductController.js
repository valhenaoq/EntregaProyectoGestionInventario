class ProductController {
    constructor({ createProduct, getProducts, getProductById, updateProduct, deleteProduct }) {
        this.createProduct = createProduct;
        this.getProducts = getProducts;
        this.getProductById = getProductById;
        this.updateProduct = updateProduct;
        this.deleteProduct = deleteProduct;
    }

    create = async (req, res) => {
        res.status(201).json(await this.createProduct.execute(req.body));
    };

    list = async (req, res) => {
        res.status(200).json(await this.getProducts.execute(req.query));
    };

    getById = async (req, res) => {
        res.status(200).json(await this.getProductById.execute(req.params.id));
    };

    update = async (req, res) => {
        res.status(200).json(await this.updateProduct.execute(req.params.id, req.body));
    };

    remove = async (req, res) => {
        res.status(200).json(await this.deleteProduct.execute(req.params.id));
    };
}

module.exports = ProductController;
