package com.programaciondm.gestioninventario.data.repository

import com.programaciondm.gestioninventario.data.api.ApiService

class ProductRepository(private val apiService: ApiService) {

    // Llama al endpoint /api/products enviando el token JWT con el prefijo Bearer
    suspend fun getProducts(token: String) = apiService.getProducts("Bearer $token")
}