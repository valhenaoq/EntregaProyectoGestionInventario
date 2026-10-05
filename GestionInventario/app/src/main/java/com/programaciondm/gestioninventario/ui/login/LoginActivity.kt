package com.programaciondm.gestioninventario.ui.login



import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.programaciondm.gestioninventario.MainActivity
import com.programaciondm.gestioninventario.R
import com.programaciondm.gestioninventario.data.api.RetrofitClient
import com.programaciondm.gestioninventario.data.repository.AuthRepository
import com.programaciondm.gestioninventario.utils.SessionManager
import com.programaciondm.gestioninventario.viewmodel.AuthViewModel
import com.programaciondm.gestioninventario.viewmodel.AuthViewModelFactory

class LoginActivity : AppCompatActivity() {

    private lateinit var editEmail: EditText
    private lateinit var editPassword: EditText
    private lateinit var btnLogin: android.widget.Button
    private lateinit var progressBar: ProgressBar
    private lateinit var textRegister: TextView
    private lateinit var sessionManager: SessionManager

    private val viewModel: AuthViewModel by viewModels {
        AuthViewModelFactory(AuthRepository(RetrofitClient.apiService))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        initializeViews()
        sessionManager = SessionManager(this)
        checkExistingSession()
        setupListeners()
        observeViewModel()
    }

    private fun initializeViews() {
        editEmail = findViewById(R.id.editEmail)
        editPassword = findViewById(R.id.editPassword)
        btnLogin = findViewById(R.id.btnLogin)
        progressBar = findViewById(R.id.progressBar)
        textRegister = findViewById(R.id.textRegister)
    }

    private fun setupListeners() {
        btnLogin.setOnClickListener {
            val email = editEmail.text.toString().trim()
            val password = editPassword.text.toString()
            viewModel.login(email, password)
        }

        textRegister.setOnClickListener {
            Toast.makeText(this, "Pantalla de registro disponible próximamente", Toast.LENGTH_SHORT).show()
        }
    }

    private fun observeViewModel() {
        viewModel.loginResult.observe(this) { result ->
            if (result != null) {
                // Guarda el token JWT de forma segura en el dispositivo
                sessionManager.saveToken(result.token)
                Toast.makeText(this, "Bienvenido ${result.user.name}", Toast.LENGTH_SHORT).show()
                goToMain()
            }
        }

        viewModel.error.observe(this) { message ->
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        }

        viewModel.loading.observe(this) { loading ->
            progressBar.visibility = if (loading) View.VISIBLE else View.GONE
            btnLogin.isEnabled = !loading
        }
    }

    private fun checkExistingSession() {
        if (sessionManager.isLoggedIn()) {
            goToMain()
        }
    }

    private fun goToMain() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish()
    }
}