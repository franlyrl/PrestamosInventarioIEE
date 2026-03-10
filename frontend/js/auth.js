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

        if (!Utils.isValidCedula(username) && !Utils.isValidEmail(username)) {
            Utils.showToast('Usuario inválido (use cédula o email)', 'error');
            return;
        }

        // Loading state
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Iniciando sesión...';
        }

        try {
            const credentials = {
                correo_electronico: Utils.isValidEmail(username) ? username : `${username}@utn.ac.cr`,
                contrasena: password
            };

            const response = await ApiService.login(credentials);
            
            // Guardar token y usuario
            appState.setToken(response.token);
            appState.setUser(response.usuario);

            Utils.showToast('¡Bienvenido al sistema!', 'success');
            
            // Transición a la app principal
            setTimeout(() => {
                this.showMainApp();
            }, 1000);

        } catch (error) {
            Utils.showToast('Credenciales incorrectas', 'error');
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
                window.dashboardController?.loadInitialData();
            }, 100);
        }
    }

    logout() {
        appState.logout();
        
        const loginPage = document.getElementById('loginPage');
        const mainApp = document.getElementById('mainApp');

        if (mainApp) {
            mainApp.classList.add('opacity-0');
            setTimeout(() => {
                mainApp.style.display = 'none';
            }, 300);
        }

        if (loginPage) {
            loginPage.style.display = 'flex';
            loginPage.classList.remove('opacity-0');
            
            // Limpiar campos
            const userInput = document.getElementById('userInput');
            const passInput = document.getElementById('passInput');
            if (userInput) userInput.value = '';
            if (passInput) passInput.value = '';
            if (userInput) userInput.focus();
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
