class SaleController {
    constructor({ createSale, getSales, getSaleById, updateSale, deleteSale }) {
        this.createSale = createSale;
        this.getSales = getSales;
        this.getSaleById = getSaleById;
        this.updateSale = updateSale;
        this.deleteSale = deleteSale;
    }

    create = async (req, res) => {
        res.status(201).json(await this.createSale.execute(req.body, req.user));
    };

    list = async (req, res) => {
        res.status(200).json(await this.getSales.execute());
    };

    getById = async (req, res) => {
        res.status(200).json(await this.getSaleById.execute(req.params.id));
    };

    update = async (req, res) => {
        res.status(200).json(await this.updateSale.execute(req.params.id, req.body, req.user));
    };

    remove = async (req, res) => {
        res.status(200).json(await this.deleteSale.execute(req.params.id, req.user));
    };
}

module.exports = SaleController;
