# Integración Android (Retrofit + Gson)

El dominio de la guía (`Task`) se sustituye por el dominio real. **No existe `/api/tasks`.**

| Guía (ejemplo) | Este proyecto |
|---|---|
| `Task`, `TaskRepository`, `TaskViewModel` | `Product`/`Sale`, `ProductRepository`/`SaleRepository`, `ProductViewModel`/`SaleViewModel` |
| `GET/POST/PUT/DELETE api/tasks` | `api/products` y `api/sales` |
| `ui/tasks` | `ui/products`, `ui/sales` (la carpeta puede conservar el nombre `tasks` si quieres respetar la guía, pero el contenido es de inventario) |

## Mapeo de nombres (importante)

La guía usa `id`, `name` y `email`; el backend usa los nombres de la base de datos. Sin mapeo, Gson deja `id = 0` y `name = null`. Se resuelve con `@SerializedName`:

| Kotlin (guía) | JSON del backend |
|---|---|
| `User.id` | `id_usuario` |
| `User.name` | `nombre` |
| `User.email` | `email` |
| `RegisterRequest.name` | `nombre` |

## Modelos (`data/models`)

```kotlin
package com.example.testapp.data.models

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
```

> Gson omite los `null` al serializar, así que `UpdateSaleRequest` solo envía los campos informados.

## `ApiService`

```kotlin
package com.example.testapp.data.api

import com.example.testapp.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @GET("/")
    suspend fun testConnection(): Response<ApiResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @GET("api/auth/me")
    suspend fun me(@Header("Authorization") authorization: String): Response<User>

    // Productos (filtros opcionales: si son null, Retrofit no los envía)
    @GET("api/products")
    suspend fun getProducts(
        @Header("Authorization") authorization: String,
        @Query("categoria") category: String? = null,
        @Query("nombre") name: String? = null
    ): Response<List<Product>>

    @GET("api/products/{id}")
    suspend fun getProduct(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int
    ): Response<Product>

    @POST("api/products")
    suspend fun createProduct(
        @Header("Authorization") authorization: String,
        @Body request: CreateProductRequest
    ): Response<Product>

    @DELETE("api/products/{id}")
    suspend fun deleteProduct(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int
    ): Response<ApiResponse>

    // Ventas
    @GET("api/sales")
    suspend fun getSales(@Header("Authorization") authorization: String): Response<List<Sale>>

    @POST("api/sales")
    suspend fun createSale(
        @Header("Authorization") authorization: String,
        @Body request: CreateSaleRequest
    ): Response<Sale>

    @PUT("api/sales/{id}")
    suspend fun updateSale(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int,
        @Body request: UpdateSaleRequest
    ): Response<Sale>

    @DELETE("api/sales/{id}")
    suspend fun deleteSale(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int
    ): Response<ApiResponse>
}
```

Los repositorios siguen el patrón de la guía: `apiService.getProducts("Bearer $token")`.

## `RetrofitClient` con URL configurable

```kotlin
object RetrofitClient {
    // Emulador: "http://10.0.2.2:3000/"  ·  Celular físico: "http://IP_DE_TU_PC:3000/"
    private const val BASE_URL = "http://10.0.2.2:3000/"
    // ... resto igual que en la guía
}
```

## Leer el mensaje de error del backend

El backend siempre responde `{ "message": "..." }` en los errores. La guía muestra un texto fijo ("Correo o contraseña incorrectos"); para mostrar el mensaje real (por ejemplo "No hay inventario suficiente para esta venta"):

```kotlin
fun <T> Response<T>.errorMessage(default: String = "Error inesperado"): String =
    try {
        com.google.gson.Gson()
            .fromJson(errorBody()?.string(), ApiResponse::class.java)?.message ?: default
    } catch (e: Exception) {
        default
    }
```

Uso: `_error.value = response.errorMessage()`. Distingue por código: `401` credenciales o sesión expirada (borra el token con `SessionManager.clearSession()` y vuelve al login), `409` conflicto de negocio, `400` datos inválidos.

## Checklist de la guía

1. `network_security_config.xml` con `10.0.2.2` y la IP de tu PC.
2. Permiso `INTERNET`, `usesCleartextTraffic="true"` y `networkSecurityConfig` en el `AndroidManifest`.
3. `MainActivity` con `testConnection()`: en logcat (filtro `API_TEST`) debe aparecer **"API funcionando correctamente"** (el backend responde exactamente ese mensaje).
4. Login con un usuario cuya contraseña esté en bcrypt o sea la de `maria.lopez@empresa.com` (ver README).
