package com.programaciondm.gestioninventario.data.api


import com.programaciondm.gestioninventario.data.models.ApiResponse
import com.programaciondm.gestioninventario.data.models.LoginRequest
import com.programaciondm.gestioninventario.data.models.LoginResponse
import com.programaciondm.gestioninventario.data.models.Product
import com.programaciondm.gestioninventario.data.models.RegisterRequest
import com.programaciondm.gestioninventario.data.models.RegisterResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {

    @GET("/")
    suspend fun testConnection(): Response<ApiResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    // Endpoint para obtener los productos del inventario
    @GET("api/products")
    suspend fun getProducts(@Header("Authorization") authorization: String): Response<List<Product>>
}