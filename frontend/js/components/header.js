// Controlador de Autenticación
class AuthController {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Login form
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        // Enter key en inputs
        const userInput = document.getElementById('userInput');
        const passInput = document.getElementById('passInput');

        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') passInput?.focus();
            });
        }

        if (passInput) {
            passInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => appState.logout());
        }
    }

    async handleLogin() {
        const userInput = document.getElementById('userInput');
        const passInput = document.getElementById('passInput');
        const loginBtn = document.getElementById('loginBtn');

        const username = userInput?.value.trim();
        const password = passInput?.value;

        // Validaciones
        if (!username || !password) {
            Utils.showToast('Por favor complete todos los campos', 'error');
            return;
        }

        // Loading state
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Iniciando sesión...';
        }

        try {
            // El backend espera correo_electronico
            let correoElectronico = username;

            // Si parece ser una cédula, convierte a formato de correo UTN
            if (/^\d{9,12}$/.test(username)) {
                correoElectronico = `${username}@utn.ac.cr`;
            }

            const credentials = {
                correo_electronico: correoElectronico.toLowerCase().trim(),
                contrasena: password
            };

            // DEBUG: Mostrar en consola y en pantalla
            console.log(' DEBUG - Intentando login con:', credentials);

            // Mostrar información de debug en la página
            const debugDiv = document.createElement('div');
            debugDiv.innerHTML = `
                <div style="position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; border: 1px solid #ccc; font-size: 12px; z-index: 9999;">
                    <strong>DEBUG LOGIN:</strong><br>
                    Email: ${credentials.correo_electronico}<br>
                    Password: ${credentials.contrasena}<br>
                    API: ${CONFIG.API_BASE_URL}/usuarios/login
                </div>
            `;
            document.body.appendChild(debugDiv);

            // DEBUG: Probar conexión a la API
            console.log(' Probando conexión a:', `${CONFIG.API_BASE_URL}/usuarios/login`);

            const response = await ApiService.login(credentials);

            console.log(' Login response:', response);

            // Eliminar debug div
            debugDiv.remove();

            // Guardar token y usuario
            appState.setToken(response.token);
            appState.setUser(response.usuario);

            Utils.showToast(`¡Bienvenido ${response.usuario.nombre || 'Usuario'}!`, 'success');

            // Transición a la app principal
            setTimeout(() => {
                this.showMainApp();
            }, 1000);

        } catch (error) {
            console.error(' Error de login:', error);
            console.error(' Detalles del error:', {
                message: error.message,
                stack: error.stack
            });

            Utils.showToast(error.message || 'Error al iniciar sesión', 'error');
        } finally {
            // Restore button state
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'ACCEDER AL SISTEMA';
            }
        }
    }

    showMainApp() {
        const loginPage = document.getElementById('loginPage');
        const mainApp = document.getElementById('mainApp');

        if (loginPage) {
            loginPage.classList.add('opacity-0');
            setTimeout(() => {
                loginPage.style.display = 'none';
            }, 300);
        }

        if (mainApp) {
            mainApp.style.display = 'block';
            setTimeout(() => {
                mainApp.classList.remove('opacity-0');
                // Cargar datos iniciales
                window.indexController?.loadDashboardData();
            }, 100);
        }
    }

    // Verificar si ya está logueado
    checkAuthStatus() {
        const token = appState.getToken();
        const user = appState.getUser();

        if (token && user) {
            // Ya está logueado, mostrar app principal
            this.showMainApp();
            return true;
        }

        return false;
    }
}

// Crear instancia global
window.authController = new AuthController();
