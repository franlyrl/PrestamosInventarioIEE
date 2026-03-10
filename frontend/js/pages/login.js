// login.js
export function renderLogin(containerId) {
    const container = document.getElementById(containerId);
    
    const loginHTML = `
    <div id="loginPage" class="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 fade-in">
        <div class="utn-blue p-8 text-center text-white">
          <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span class="utn-text font-black text-xl">UTN</span>
          </div>
          <h2 class="text-2xl font-bold tracking-tight">Sistema de Electrónica</h2>
          <p class="text-blue-200 text-xs mt-1 uppercase tracking-widest font-medium">
            Control de Activos e Insumos
          </p>
        </div>

        <div class="p-8 space-y-5">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Usuario / Carnet</label>
            <input type="text" id="userInput" placeholder="604550123" class="input-field" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Contraseña</label>
            <input type="password" id="passInput" placeholder="••••••••" class="input-field" />
          </div>

          <button id="loginBtn" class="btn-primary w-full">ACCEDER AL SISTEMA</button>
        </div>
      </div>
    </div>`;

    container.innerHTML = loginHTML;

    // Configurar el evento del botón justo después de insertarlo
    document.getElementById('loginBtn').addEventListener('click', () => {
        const user = document.getElementById('userInput').value;
        const pass = document.getElementById('passInput').value;
        
        // Aquí iría tu lógica de validación
        console.log("Intentando entrar con:", user);
        
        if(user && pass) {
            alert("Validando credenciales...");
        }
    });
}