class AuthController {
    constructor({ registerUser, loginUser, getUserById }) {
        this.registerUser = registerUser;
        this.loginUser = loginUser;
        this.getUserById = getUserById;
    }

    register = async (req, res) => {
        const user = await this.registerUser.execute(req.body);
        res.status(201).json({ message: 'Usuario registrado exitosamente', user });
    };

    login = async (req, res) => {
        const { token, user } = await this.loginUser.execute(req.body);
        res.status(200).json({ message: 'Inicio de sesión exitoso', token, user });
    };

    me = async (req, res) => {
        const user = await this.getUserById.execute(req.user.id_usuario);
        res.status(200).json(user);
    };
}

module.exports = AuthController;
