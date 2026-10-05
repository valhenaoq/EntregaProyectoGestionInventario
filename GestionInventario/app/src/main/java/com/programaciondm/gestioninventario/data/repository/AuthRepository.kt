package com.programaciondm.gestioninventario.data.repository

import com.programaciondm.gestioninventario.data.api.ApiService
import com.programaciondm.gestioninventario.data.models.LoginRequest

class AuthRepository(private val apiService: ApiService) {

    suspend fun login(email: String, password: String) =
        apiService.login(LoginRequest(email, password))
}
