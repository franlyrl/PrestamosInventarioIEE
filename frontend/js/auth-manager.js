/**
 * AuthManager: Handles UI updates for the user session
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Recover user data from localStorage
    const userDataRaw = localStorage.getItem('sie_user');
    const user = userDataRaw ? JSON.parse(userDataRaw) : null;

    // Elements from your HTML
    const elements = {
        menuName: document.getElementById('userMenuName'),      // The button text
        infoText: document.getElementById('userInfo'),          // The "Usuario" text above Connected
        dropdownName: document.getElementById('dropdownUserName'), // Inside the blue header
        dropdownRole: document.getElementById('dropdownUserRole'), // Inside the blue header
        userBtn: document.getElementById('user-menu-btn'),      // The main button
        dropdown: document.getElementById('user-dropdown'),     // The hidden menu
        logoutBtn: document.getElementById('logoutBtn')         // Logout button
    };

    // 2. Populate data if user exists
    if (user) {
        const name = user.nombre_completo || user.nombre || "Usuario";
        const role = user.rol_nombre || user.rol || "Colaborador";

        if (elements.menuName) elements.menuName.textContent = name;
        if (elements.infoText) elements.infoText.textContent = name;
        if (elements.dropdownName) elements.dropdownName.textContent = name;
        if (elements.dropdownRole) elements.dropdownRole.textContent = role;
    } else {
        // Redirect to login if no session is found (optional security)
        // window.location.href = '/login.html';
    }

    // 3. Dropdown Toggle Logic
    if (elements.userBtn && elements.dropdown) {
        elements.userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.dropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            elements.dropdown.classList.add('hidden');
        });
    }

    // 4. Logout Logic
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('sie_user');
            localStorage.removeItem('sie_token'); // If you are using tokens
            window.location.href = '/login.html';
        });
    }
});