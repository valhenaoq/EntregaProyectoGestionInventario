package com.programaciondm.gestioninventario.data.models
import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("id_usuario") val id: Int,
    @SerializedName("nombre") val name: String,
    val email: String,
    val rol: String,
    val activo: Boolean
)

data class LoginRequest(val email: String, val password: String)

data class RegisterRequest(
    @SerializedName("nombre") val name: String,
    val email: String,
    val password: String
)

data class LoginResponse(val message: String, val token: String, val user: User)
data class RegisterResponse(val message: String, val user: User)
data class ApiResponse(val message: String)

data class Product(
    @SerializedName("id_producto") val id: Int,
    @SerializedName("codigo_barras") val barcode: String?,
    @SerializedName("nombre") val name: String,
    @SerializedName("descripcion") val description: String?,
    @SerializedName("precio_compra") val purchasePrice: Double,
    @SerializedName("precio_venta") val salePrice: Double,
    @SerializedName("stock_actual") val stock: Int,
    @SerializedName("stock_minimo") val minStock: Int,
    @SerializedName("id_categoria") val categoryId: Int?,
    @SerializedName("categoria") val category: String?,
    @SerializedName("id_proveedor") val supplierId: Int?,
    @SerializedName("proveedor") val supplier: String?
)

data class CreateProductRequest(
    @SerializedName("nombre") val name: String,
    @SerializedName("descripcion") val description: String,
    @SerializedName("precio_venta") val salePrice: Double,
    @SerializedName("stock_actual") val stock: Int,
    @SerializedName("id_categoria") val categoryId: Int
)

data class Sale(
    @SerializedName("id_venta") val id: Int,
    @SerializedName("fecha_venta") val date: String,
    @SerializedName("cantidad") val quantity: Int,
    @SerializedName("total_venta") val total: Double,
    @SerializedName("id_usuario") val userId: Int,
    @SerializedName("nombre_usuario") val userName: String,
    @SerializedName("id_producto") val productId: Int,
    @SerializedName("nombre_producto") val productName: String
)

// El total NO se envía: lo calcula el backend
data class CreateSaleRequest(
    @SerializedName("cantidad") val quantity: Int,
    @SerializedName("id_producto") val productId: Int
)

data class UpdateSaleRequest(
    @SerializedName("cantidad") val quantity: Int? = null,
    @SerializedName("id_producto") val productId: Int? = null
)