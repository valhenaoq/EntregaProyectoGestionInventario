class User {
    constructor({ id_usuario, nombre, email, password_hash, rol, activo, creado_en }) {
        this.id_usuario = id_usuario;
        this.nombre = nombre;
        this.email = email;
        this.password_hash = password_hash;
        this.rol = rol;
        this.activo = Boolean(activo);
        this.creado_en = creado_en;
    }

    // Representación pública: nunca incluye la contraseña
    toPublic() {
        return {
            id_usuario: this.id_usuario,
            nombre: this.nombre,
            email: this.email,
            rol: this.rol,
            activo: this.activo,
            creado_en: this.creado_en
        };
    }
}

User.ROLES = ['admin', 'empleado'];
User.DEFAULT_ROLE = 'empleado';

module.exports = User;
