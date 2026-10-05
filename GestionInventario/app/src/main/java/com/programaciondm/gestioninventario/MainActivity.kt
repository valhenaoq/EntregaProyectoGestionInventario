package com.programaciondm.gestioninventario

//package com.programaciondm.gestioninventario

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.programaciondm.gestioninventario.data.api.RetrofitClient
import com.programaciondm.gestioninventario.data.repository.ProductRepository
import com.programaciondm.gestioninventario.ui.login.LoginActivity
import com.programaciondm.gestioninventario.ui.products.ProductAdapter
import com.programaciondm.gestioninventario.utils.SessionManager
import com.programaciondm.gestioninventario.viewmodel.ProductViewModel
import com.programaciondm.gestioninventario.viewmodel.ProductViewModelFactory
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var productAdapter: ProductAdapter
    private lateinit var recyclerProducts: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var textEmpty: TextView

    private val viewModel: ProductViewModel by viewModels {
        ProductViewModelFactory(ProductRepository(RetrofitClient.apiService))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.testConnection()
                Log.d("API_TEST", "Código: ${response.code()} - ${response.body()?.message}")
            } catch (e: Exception) {
                Log.e("API_TEST", "Error de conexión: ${e.message}", e)
            }
        }



        sessionManager = SessionManager(this)

        initializeViews()
        setupRecyclerView()
        setupLogout()
        observeViewModel()
    }


    override fun onResume() {
        super.onResume()
        if (::sessionManager.isInitialized) {
            loadProducts()
        }
    }

    private fun initializeViews() {
        recyclerProducts = findViewById(R.id.recyclerTasks) // Reutiliza el RecyclerView de tu layout principal
        progressBar = findViewById(R.id.progressBarTasks)
        textEmpty = findViewById(R.id.textEmpty)
    }

    private fun setupRecyclerView() {
        productAdapter = ProductAdapter()
        recyclerProducts.layoutManager = LinearLayoutManager(this)
        recyclerProducts.adapter = productAdapter
    }

    private fun loadProducts() {
        val token = sessionManager.getToken()
        if (token == null) {
            logout()
            return
        }
        viewModel.loadProducts(token)
    }

    private fun observeViewModel() {
        viewModel.products.observe(this) { products ->
            productAdapter.updateProducts(products)
            textEmpty.visibility = if (products.isEmpty()) View.VISIBLE else View.GONE
            textEmpty.text = "No hay productos en el inventario"
        }

        viewModel.loading.observe(this) { loading ->
            progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(this) { message ->
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupLogout() {
        val btnLogout = findViewById<Button>(R.id.btnLogout)
        btnLogout?.setOnClickListener {
            logout()
        }
    }

    private fun logout() {
        sessionManager.clearSession()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}