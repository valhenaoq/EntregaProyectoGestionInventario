package com.programaciondm.gestioninventario.utils

import android.content.Context

class SessionManager(context: Context) {

    private val preferences = context.getSharedPreferences(
        "user_session", Context.MODE_PRIVATE
    )

    fun saveToken(token: String) {
        preferences.edit()
            .putString("token", token)
            .apply()
    }

    fun getToken(): String? {
        return preferences.getString("token", null)
    }

    fun isLoggedIn(): Boolean {
        return !getToken().isNullOrEmpty()
    }

    fun clearSession() {
        preferences.edit()
            .clear()
            .apply()
    }
}