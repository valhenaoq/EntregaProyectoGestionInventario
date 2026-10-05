class UserController {
    constructor({ getUsers, getUserById, updateUser, deleteUser }) {
        this.getUsers = getUsers;
        this.getUserById = getUserById;
        this.updateUser = updateUser;
        this.deleteUser = deleteUser;
    }

    list = async (req, res) => {
        res.status(200).json(await this.getUsers.execute());
    };

    getById = async (req, res) => {
        res.status(200).json(await this.getUserById.execute(req.params.id));
    };

    update = async (req, res) => {
        res.status(200).json(await this.updateUser.execute(req.params.id, req.body, req.user));
    };

    remove = async (req, res) => {
        res.status(200).json(await this.deleteUser.execute(req.params.id, req.user));
    };
}

module.exports = UserController;
