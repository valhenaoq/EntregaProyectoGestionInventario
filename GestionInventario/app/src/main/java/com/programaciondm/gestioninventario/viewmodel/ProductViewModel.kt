package com.programaciondm.gestioninventario.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.programaciondm.gestioninventario.data.models.Product
import com.programaciondm.gestioninventario.data.repository.ProductRepository
import kotlinx.coroutines.launch

class ProductViewModel(private val repository: ProductRepository) : ViewModel() {

    private val _products = MutableLiveData<List<Product>>()
    val products: LiveData<List<Product>> get() = _products

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> get() = _loading

    private val _error = MutableLiveData<String>()
    val error: LiveData<String> get() = _error

    fun loadProducts(token: String) {
        viewModelScope.launch {
            try {
                _loading.value = true
                val response = repository.getProducts(token)

                if (response.isSuccessful) {
                    _products.value = response.body() ?: emptyList()
                } else {
                    when (response.code()) {
                        401 -> _error.value = "La sesión expiró. Inicia sesión nuevamente."
                        else -> _error.value = "No fue posible cargar el inventario"
                    }
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Error de conexión"
            } finally {
                _loading.value = false
            }
        }
    }
}