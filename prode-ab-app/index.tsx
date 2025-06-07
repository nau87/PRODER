
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

interface User {
    nombre: string;
    usuario: string;
    email: string;
    telefono?: string;
    hasActiveSubscription?: boolean;
}

interface MatchPrediction {
    matchLabel: string; // "Equipo A vs Equipo B"
    prediction: 'LOCAL' | 'EMPATE' | 'VISITA';
}

interface PredictionSet {
    userId: string;
    fechaNumber: number;
    timestamp: string; // ISO string
    predictions: MatchPrediction[];
}

// Interfaces for Admin Match Definition and Results
interface MatchPair {
    localTeam: string;
    visitorTeam: string;
}

interface FechaMatchDefinition {
    fechaNumber: number;
    matches: MatchPair[]; // Array of 8 MatchPair objects
    predictionsOpen: boolean; // Added for explicit control
}

interface OfficialMatchResult {
    localTeam: string;
    visitorTeam: string;
    outcome: 'LOCAL' | 'EMPATE' | 'VISITA';
}

interface OfficialResultsSet {
    fechaNumber: number;
    results: OfficialMatchResult[]; // Array of 8 OfficialMatchResult objects
}


document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const registerForm = document.getElementById('register-form') as HTMLFormElement;
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    const authContainer = document.getElementById('auth-container');
    const adminPanel = document.getElementById('admin-panel');
    const userMenuContainer = document.getElementById('user-menu-container');
    const paymentScreenContainer = document.getElementById('payment-screen-container');
    const gameScreenContainer = document.getElementById('game-screen-container');
    const historyScreenContainer = document.getElementById('history-screen-container');
    const defineMatchesScreen = document.getElementById('define-matches-screen');
    const loadResultsScreen = document.getElementById('load-results-screen');


    const adminLogoutBtn = document.getElementById('admin-logout-btn') as HTMLButtonElement;
    const userTableBody = document.getElementById('user-table-body') as HTMLTableSectionElement | null;
    const noUsersMessage = document.getElementById('no-users-message') as HTMLElement | null;
    const btnShowRegisteredUsers = document.getElementById('btn-show-registered-users') as HTMLButtonElement;
    const registeredUsersSection = document.getElementById('registered-users-section') as HTMLElement;


    // Admin Panel Action Buttons
    const btnGoToDefineMatches = document.getElementById('btn-go-to-define-matches') as HTMLButtonElement;
    const btnGoToLoadResults = document.getElementById('btn-go-to-load-results') as HTMLButtonElement;

    // Define Matches Screen Elements
    const defineFechaSelect = document.getElementById('define-fecha-select') as HTMLSelectElement;
    const defineMatchesForm = document.getElementById('define-matches-form') as HTMLFormElement;
    const definedMatchesInputsList = document.getElementById('defined-matches-inputs-list') as HTMLElement;
    const defineMatchesFeedback = document.getElementById('define-matches-feedback') as HTMLElement;
    const defineMatchesBackBtn = document.getElementById('define-matches-back-btn') as HTMLButtonElement;
    const defineFechaStatusMessage = document.getElementById('define-fecha-status-message') as HTMLElement;
    const closePredictionsBtn = document.getElementById('close-predictions-btn') as HTMLButtonElement;


    // Load Results Screen Elements
    const resultsFechaSelect = document.getElementById('results-fecha-select') as HTMLSelectElement;
    const loadResultsForm = document.getElementById('load-results-form') as HTMLFormElement;
    const officialResultsInputsList = document.getElementById('official-results-inputs-list') as HTMLElement;
    const loadResultsFeedback = document.getElementById('load-results-feedback') as HTMLElement;
    const resultsBackBtn = document.getElementById('results-back-btn') as HTMLButtonElement;


    const userGreeting = document.getElementById('user-greeting') as HTMLElement | null;
    const userLogoutBtn = document.getElementById('user-logout-btn') as HTMLButtonElement;
    const btnJugar = document.getElementById('btn-jugar') as HTMLButtonElement;
    const btnHistorialPredicciones = document.getElementById('btn-historial-predicciones') as HTMLButtonElement;
    const btnTablaApertura = document.getElementById('btn-tabla-apertura') as HTMLButtonElement;
    const btnTablaClausura = document.getElementById('btn-tabla-clausura') as HTMLButtonElement;
    const btnTablaGeneral = document.getElementById('btn-tabla-general') as HTMLButtonElement;
    const btnResultadosOficiales = document.getElementById('btn-resultados-oficiales') as HTMLButtonElement;
    const btnGanadores = document.getElementById('btn-ganadores') as HTMLButtonElement;


    // Payment Screen Elements
    const mpPaymentLinkBtn = document.getElementById('mp-payment-link-btn') as HTMLAnchorElement;
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn') as HTMLButtonElement;
    const paymentBackToMenuBtn = document.getElementById('payment-back-to-menu-btn') as HTMLButtonElement;

    // Game Screen Elements
    const gameScreenTitle = document.getElementById('game-screen-title') as HTMLElement;
    const predictionsForm = document.getElementById('predictions-form') as HTMLFormElement;
    const matchesList = document.getElementById('matches-list') as HTMLElement | null;
    const savePredictionsBtn = document.getElementById('save-predictions-btn') as HTMLButtonElement;
    const gameScreenMessage = document.getElementById('game-screen-message') as HTMLElement;
    const gameBackToMenuBtn = document.getElementById('game-back-to-menu-btn') as HTMLButtonElement;

    // History Screen Elements
    const predictionsHistoryList = document.getElementById('predictions-history-list') as HTMLElement | null;
    const noHistoryMessage = document.getElementById('no-history-message') as HTMLElement | null;
    const historyBackToMenuBtn = document.getElementById('history-back-to-menu-btn') as HTMLButtonElement;


    // --- State ---
    let currentUser: User | null = null;
    let currentPlayingFecha: number | null = null;
    const TOTAL_FECHAS = 22; // 11 Apertura + 11 Clausura
    const MATCHES_PER_FECHA = 8;

    const USERS_STORAGE_KEY = 'prodeABUsers';
    const PREDICTIONS_HISTORY_STORAGE_KEY = 'prodeABPredictions';
    const FECHA_DEFINITIONS_STORAGE_KEY = 'prodeABFechaDefinitions';
    const OFFICIAL_RESULTS_STORAGE_KEY = 'prodeABOfficialResults';


    // --- Utility Functions ---
    const displayError = (inputElement: HTMLInputElement, message: string) => {
        const formGroup = inputElement.parentElement;
        const errorElement = formGroup?.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            (errorElement as HTMLElement).style.display = 'block';
        }
        inputElement.classList.add('input-error');
    };

    const clearError = (inputElement: HTMLInputElement) => {
        const formGroup = inputElement.parentElement;
        const errorElement = formGroup?.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
            (errorElement as HTMLElement).style.display = 'none';
        }
        inputElement.classList.remove('input-error');
    };

    const clearAllFormErrors = (form: HTMLFormElement) => {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => clearError(input));
        const generalError = form.querySelector('.form-general-error') as HTMLElement;
        if (generalError) generalError.style.display = 'none';
    };

    const validateField = (inputElement: HTMLInputElement): boolean => {
        clearError(inputElement);
        let isValid = true;
        const value = inputElement.value.trim();

        if (inputElement.required && value === '') {
            displayError(inputElement, 'Este campo es obligatorio.');
            isValid = false;
        } else if (inputElement.type === 'email' && value !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                displayError(inputElement, 'Ingresa un email válido.');
                isValid = false;
            }
        }
        if (inputElement.id === 'register-contrasena' && value !== '' && value.length < 6) {
             displayError(inputElement, 'La contraseña debe tener al menos 6 caracteres.');
             isValid = false;
        }
        return isValid;
    };

    const validateForm = (form: HTMLFormElement): boolean => {
        let isFormValid = true;
        const inputs = form.querySelectorAll('input[required], input[type="email"], input[type="password"]');
        inputs.forEach(input => {
            if (!validateField(input as HTMLInputElement)) {
                isFormValid = false;
            }
        });
        return isFormValid;
    };

    const showFeedbackMessage = (element: HTMLElement | null, message: string, type: 'success' | 'error' | 'neutral', autoHide: boolean = true) => {
        if (!element) return;
        element.textContent = message;
        element.className = `feedback-message ${type}`; 
        element.style.display = 'block';
        if (autoHide) {
            setTimeout(() => {
                element.style.display = 'none';
            }, 3000);
        }
    };


    // --- Storage Functions ---
    const getUsersFromStorage = (): User[] => {
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    };
    const saveUsersToStorage = (users: User[]) => {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    };

    const getPredictionHistoryFromStorage = (): PredictionSet[] => {
        const historyJson = localStorage.getItem(PREDICTIONS_HISTORY_STORAGE_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    };
    const savePredictionHistoryToStorage = (history: PredictionSet[]) => {
        localStorage.setItem(PREDICTIONS_HISTORY_STORAGE_KEY, JSON.stringify(history));
    };

    const getFechaDefinitionsFromStorage = (): FechaMatchDefinition[] => {
        const definitionsJson = localStorage.getItem(FECHA_DEFINITIONS_STORAGE_KEY);
        const definitions: FechaMatchDefinition[] = definitionsJson ? JSON.parse(definitionsJson) : [];
        // Ensure predictionsOpen defaults to true if not present
        return definitions.map(def => ({
            ...def,
            predictionsOpen: def.predictionsOpen === undefined ? true : def.predictionsOpen
        }));
    };
    const saveFechaDefinitionsToStorage = (definitions: FechaMatchDefinition[]) => {
        localStorage.setItem(FECHA_DEFINITIONS_STORAGE_KEY, JSON.stringify(definitions));
    };

    const getOfficialResultsFromStorage = (): OfficialResultsSet[] => {
        const resultsJson = localStorage.getItem(OFFICIAL_RESULTS_STORAGE_KEY);
        return resultsJson ? JSON.parse(resultsJson) : [];
    };
    const saveOfficialResultsToStorage = (results: OfficialResultsSet[]) => {
        localStorage.setItem(OFFICIAL_RESULTS_STORAGE_KEY, JSON.stringify(results));
    };


    // --- View Management ---
    const updateUserMenuForRole = () => {
        if (!currentUser || !btnJugar || !btnHistorialPredicciones ||
            !btnTablaApertura || !btnTablaClausura || !btnTablaGeneral || 
            !btnResultadosOficiales || !btnGanadores) return;

        const isAdmin = currentUser.usuario === 'admin';

        btnJugar.style.display = isAdmin ? 'none' : 'block'; 
        btnHistorialPredicciones.style.display = isAdmin ? 'none' : 'block'; 

        // Hide other menu items for admin
        btnTablaApertura.style.display = isAdmin ? 'none' : 'block';
        btnTablaClausura.style.display = isAdmin ? 'none' : 'block';
        btnTablaGeneral.style.display = isAdmin ? 'none' : 'block';
        btnResultadosOficiales.style.display = isAdmin ? 'none' : 'block';
        btnGanadores.style.display = isAdmin ? 'none' : 'block';
        
        if (!isAdmin) {
            btnJugar.disabled = false;
            btnJugar.title = '';
        }
    };
    
    type ViewId = 'auth' | 'admin' | 'userMenu' | 'payment' | 'game' | 'history' | 'defineMatches' | 'loadResults';

    const showView = (viewId: ViewId) => {
        const allViews = [
            authContainer, adminPanel, userMenuContainer,
            paymentScreenContainer, gameScreenContainer, historyScreenContainer,
            defineMatchesScreen, loadResultsScreen
        ];
        allViews.forEach(view => view!.style.display = 'none'); 

        let activeViewContainer: HTMLElement | null = null;

        switch (viewId) {
            case 'auth':
                activeViewContainer = authContainer;
                if (loginForm && registerForm) {
                    loginForm.classList.add('active-form');
                    registerForm.classList.remove('active-form');
                    clearAllFormErrors(registerForm);
                    clearAllFormErrors(loginForm);
                    loginForm.reset();
                }
                break;
            case 'admin':
                activeViewContainer = adminPanel;
                if (defineMatchesFeedback) defineMatchesFeedback.style.display = 'none';
                if (loadResultsFeedback) loadResultsFeedback.style.display = 'none';
                if (defineFechaStatusMessage) defineFechaStatusMessage.style.display = 'none';
                if (registeredUsersSection) registeredUsersSection.style.display = 'none'; // Hide by default
                break;
            case 'userMenu':
                activeViewContainer = userMenuContainer;
                if (userGreeting && currentUser) {
                    userGreeting.textContent = `¡Hola, ${currentUser.nombre}!`;
                }
                updateUserMenuForRole();
                break;
            case 'payment':
                activeViewContainer = paymentScreenContainer;
                break;
            case 'game':
                activeViewContainer = gameScreenContainer;
                break;
            case 'history':
                activeViewContainer = historyScreenContainer;
                displayPredictionHistory();
                break;
            case 'defineMatches':
                activeViewContainer = defineMatchesScreen;
                if(defineFechaSelect) populateFechaSelect(defineFechaSelect, TOTAL_FECHAS);
                if(defineFechaSelect) renderMatchDefinitionInputs(parseInt(defineFechaSelect.value) || 1);
                if (defineMatchesFeedback) defineMatchesFeedback.style.display = 'none';
                break;
            case 'loadResults':
                activeViewContainer = loadResultsScreen;
                if (resultsFechaSelect) populateFechaSelect(resultsFechaSelect, TOTAL_FECHAS);
                if (resultsFechaSelect) renderOfficialResultsInputs(parseInt(resultsFechaSelect.value) || 1);
                if (loadResultsFeedback) loadResultsFeedback.style.display = 'none';
                break;
        }
        if (activeViewContainer) {
            activeViewContainer.style.display = 'block'; 
        }
    };

    // --- Admin Panel Functions ---
    const displayRegisteredUsers = () => {
        const users = getUsersFromStorage();
        if (!userTableBody || !noUsersMessage) return;

        userTableBody.innerHTML = ''; 

        if (users.length === 0) {
            noUsersMessage.style.display = 'block';
            if (userTableBody.parentElement) { 
                 (userTableBody.parentElement as HTMLTableElement).style.display = 'none';
            }
        } else {
            noUsersMessage.style.display = 'none';
            if (userTableBody.parentElement) { 
                (userTableBody.parentElement as HTMLTableElement).style.display = 'table';
            }
            users.forEach(user => {
                const row = userTableBody.insertRow();
                row.insertCell().textContent = user.nombre;
                row.insertCell().textContent = user.usuario;
                row.insertCell().textContent = user.email;
                row.insertCell().textContent = user.telefono || '-';
            });
        }
    };

    const populateFechaSelect = (selectElement: HTMLSelectElement, maxFechas: number) => {
        selectElement.innerHTML = '';
        for (let i = 1; i <= maxFechas; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            option.textContent = `Fecha ${i}`;
            selectElement.appendChild(option);
        }
    };

    // --- Admin: Define Matches Functions ---
    const renderMatchDefinitionInputs = (fechaNumber: number) => {
        if (!definedMatchesInputsList || !defineFechaStatusMessage || !closePredictionsBtn) return;
        definedMatchesInputsList.innerHTML = '';
        const allDefinitions = getFechaDefinitionsFromStorage();
        const fechaDef = allDefinitions.find(def => def.fechaNumber === fechaNumber);

        const predictionsOpen = fechaDef ? fechaDef.predictionsOpen : true; // Default to true if no def

        defineFechaStatusMessage.textContent = `Estado: Predicciones ${predictionsOpen ? 'Abiertas' : 'Cerradas'}`;
        defineFechaStatusMessage.className = `feedback-message ${predictionsOpen ? 'neutral' : 'error'}`; // Use error style for closed
        defineFechaStatusMessage.style.display = 'block';
        closePredictionsBtn.disabled = !predictionsOpen;


        for (let i = 0; i < MATCHES_PER_FECHA; i++) {
            const matchData = fechaDef?.matches[i] || { localTeam: '', visitorTeam: '' };
            const formGroup = document.createElement('div');
            formGroup.classList.add('form-group');
            formGroup.innerHTML = `
                <p>Partido ${i + 1}:</p>
                <div class="admin-match-input-group">
                    <label for="local-team-${fechaNumber}-${i}">Equipo Local:</label>
                    <input type="text" id="local-team-${fechaNumber}-${i}" name="local-team-${i}" value="${matchData.localTeam}" placeholder="Nombre Equipo Local" required>
                </div>
                <div class="admin-match-input-group">
                    <label for="visitor-team-${fechaNumber}-${i}">Equipo Visitante:</label>
                    <input type="text" id="visitor-team-${fechaNumber}-${i}" name="visitor-team-${i}" value="${matchData.visitorTeam}" placeholder="Nombre Equipo Visitante" required>
                </div>
            `;
            definedMatchesInputsList.appendChild(formGroup);
        }
    };

    const handleSaveMatchDefinitions = () => {
        if (!defineMatchesForm || !defineFechaSelect) return;
        const fechaNumber = parseInt(defineFechaSelect.value);
        const formData = new FormData(defineMatchesForm);
        const newMatches: MatchPair[] = [];
        let allValid = true;

        for (let i = 0; i < MATCHES_PER_FECHA; i++) {
            const localTeam = formData.get(`local-team-${i}`) as string;
            const visitorTeam = formData.get(`visitor-team-${i}`) as string;
            if (!localTeam?.trim() || !visitorTeam?.trim()) {
                allValid = false;
                break;
            }
            newMatches.push({ localTeam: localTeam.trim(), visitorTeam: visitorTeam.trim() });
        }

        if (!allValid) {
            showFeedbackMessage(defineMatchesFeedback, 'Todos los nombres de equipos son obligatorios.', 'error');
            return;
        }

        let definitions = getFechaDefinitionsFromStorage();
        const existingDefIndex = definitions.findIndex(def => def.fechaNumber === fechaNumber);

        if (existingDefIndex > -1) {
            definitions[existingDefIndex].matches = newMatches;
            // Do NOT change predictionsOpen status here, it's managed by closePredictionsBtn or official results load
        } else {
            definitions.push({ fechaNumber, matches: newMatches, predictionsOpen: true }); // Default to open
        }
        saveFechaDefinitionsToStorage(definitions);
        showFeedbackMessage(defineMatchesFeedback, `Partidos para Fecha ${fechaNumber} guardados.`, 'success');
        renderMatchDefinitionInputs(fechaNumber); // Re-render to reflect saved state and potentially update status message if it was a new definition
        // setTimeout(() => showView('admin'), 500); // Keep user on this screen to see status or close predictions
    };

    // --- Admin: Load Results Functions ---
    const renderOfficialResultsInputs = (fechaNumber: number) => {
        if (!officialResultsInputsList || !loadResultsForm) return;
        officialResultsInputsList.innerHTML = '';
        const definitions = getFechaDefinitionsFromStorage();
        const fechaDef = definitions.find(def => def.fechaNumber === fechaNumber);

        if (!fechaDef || fechaDef.matches.length !== MATCHES_PER_FECHA) {
            officialResultsInputsList.innerHTML = `<p class="error-message" style="display:block; text-align:center;">Primero define los partidos para la Fecha ${fechaNumber}.</p>`;
            const saveBtn = loadResultsForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
            if (saveBtn) saveBtn.disabled = true;
            return;
        }
        
        const saveBtn = loadResultsForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (saveBtn) saveBtn.disabled = false;


        const allResults = getOfficialResultsFromStorage();
        const existingResultsSet = allResults.find(rs => rs.fechaNumber === fechaNumber);

        fechaDef.matches.forEach((match, i) => {
            const existingResult = existingResultsSet?.results.find(r => r.localTeam === match.localTeam && r.visitorTeam === match.visitorTeam);
            const formGroup = document.createElement('div');
            formGroup.classList.add('form-group');
            formGroup.innerHTML = `
                <p>Partido ${i + 1}: ${match.localTeam} vs ${match.visitorTeam}</p>
                <input type="hidden" name="local-team-${i}" value="${match.localTeam}">
                <input type="hidden" name="visitor-team-${i}" value="${match.visitorTeam}">
                <div class="options-group" role="radiogroup">
                    <input type="radio" id="result-${fechaNumber}-${i}-local" name="result-${i}" value="LOCAL" ${existingResult?.outcome === 'LOCAL' ? 'checked' : ''} required>
                    <label for="result-${fechaNumber}-${i}-local">LOCAL</label>
                    <input type="radio" id="result-${fechaNumber}-${i}-empate" name="result-${i}" value="EMPATE" ${existingResult?.outcome === 'EMPATE' ? 'checked' : ''} required>
                    <label for="result-${fechaNumber}-${i}-empate">EMPATE</label>
                    <input type="radio" id="result-${fechaNumber}-${i}-visita" name="result-${i}" value="VISITA" ${existingResult?.outcome === 'VISITA' ? 'checked' : ''} required>
                    <label for="result-${fechaNumber}-${i}-visita">VISITA</label>
                </div>
            `;
            officialResultsInputsList.appendChild(formGroup);
        });
    };
    
    const handleSaveOfficialResults = () => {
        if (!loadResultsForm || !resultsFechaSelect) return;
        const fechaNumber = parseInt(resultsFechaSelect.value);
        const formData = new FormData(loadResultsForm);
        const newResults: OfficialMatchResult[] = [];
        let allPredicted = true;

        for (let i = 0; i < MATCHES_PER_FECHA; i++) {
            const localTeam = formData.get(`local-team-${i}`) as string;
            const visitorTeam = formData.get(`visitor-team-${i}`) as string;
            const outcome = formData.get(`result-${i}`) as 'LOCAL' | 'EMPATE' | 'VISITA' | null;

            if (!localTeam || !visitorTeam || !outcome) { 
                allPredicted = false;
                break;
            }
            newResults.push({ localTeam, visitorTeam, outcome });
        }
        
        if (!allPredicted) {
             showFeedbackMessage(loadResultsFeedback, 'Se debe seleccionar un resultado para cada partido.', 'error');
             return;
        }

        let officialResultsSets = getOfficialResultsFromStorage();
        const existingSetIndex = officialResultsSets.findIndex(set => set.fechaNumber === fechaNumber);

        if (existingSetIndex > -1) {
            officialResultsSets[existingSetIndex].results = newResults;
        } else {
            officialResultsSets.push({ fechaNumber, results: newResults });
        }
        saveOfficialResultsToStorage(officialResultsSets);
        
        // Also close predictions for this fecha
        let definitions = getFechaDefinitionsFromStorage();
        const defIndex = definitions.findIndex(d => d.fechaNumber === fechaNumber);
        if (defIndex > -1) {
            definitions[defIndex].predictionsOpen = false;
            saveFechaDefinitionsToStorage(definitions);
        }

        showFeedbackMessage(loadResultsFeedback, `Resultados para Fecha ${fechaNumber} guardados y predicciones cerradas.`, 'success');
        setTimeout(() => showView('admin'), 1000); // Increased timeout slightly
    };


    // --- Game Screen Functions ---
    const renderGameMatches = (fechaNumber: number) => {
        if (!matchesList || !gameScreenTitle || !savePredictionsBtn || !gameScreenMessage) return;
        matchesList.innerHTML = ''; 
        gameScreenMessage.style.display = 'none';
        savePredictionsBtn.disabled = false; 

        const definitions = getFechaDefinitionsFromStorage();
        const fechaDef = definitions.find(def => def.fechaNumber === fechaNumber);
        const allUserPredictions = getPredictionHistoryFromStorage();
        const userPredictionsForThisFecha = allUserPredictions.find(pSet => pSet.userId === currentUser?.usuario && pSet.fechaNumber === fechaNumber);

        gameScreenTitle.textContent = `Realiza tus Predicciones - Fecha ${fechaNumber}`;

        if (!fechaDef || !fechaDef.predictionsOpen) {
            const message = !fechaDef ? `Los partidos para la Fecha ${fechaNumber} aún no han sido definidos por el administrador.` : `Las predicciones para la Fecha ${fechaNumber} están cerradas.`;
            showFeedbackMessage(gameScreenMessage, message, 'error', false);
            savePredictionsBtn.disabled = true;
            // Render disabled placeholders
            Array(MATCHES_PER_FECHA).fill(null).forEach((_, i) => {
                 const matchId = `match-${fechaNumber}-${i}`;
                 const matchItem = document.createElement('div');
                 matchItem.classList.add('match-prediction-item');
                 const teamLabel = (fechaDef && fechaDef.matches[i]) ? `${fechaDef.matches[i].localTeam} vs ${fechaDef.matches[i].visitorTeam}` : `Equipo ${i*2+1} vs Equipo ${i*2+2}`;
                 matchItem.innerHTML = `<p id="${matchId}-label">${teamLabel} (No jugable)</p><div class="options-group" role="radiogroup"></div>`;
                 const optionsGroup = matchItem.querySelector('.options-group') as HTMLElement;
                 (['LOCAL', 'EMPATE', 'VISITA'] as const).forEach(option => {
                    const radioId = `${matchId}-${option.toLowerCase()}`;
                    const radioInput = document.createElement('input');
                    radioInput.type = 'radio'; radioInput.id = radioId; radioInput.name = matchId; radioInput.value = option; radioInput.required = true; radioInput.disabled = true;
                    const radioLabel = document.createElement('label');
                    radioLabel.htmlFor = radioId; radioLabel.textContent = option;
                    optionsGroup.appendChild(radioInput); optionsGroup.appendChild(radioLabel);
                 });
                 matchesList.appendChild(matchItem);
            });
            return;
        }
        
        if (userPredictionsForThisFecha) {
            showFeedbackMessage(gameScreenMessage, 'Ya has guardado tus predicciones para esta Fecha. No se pueden modificar.', 'error', false);
            savePredictionsBtn.disabled = true;
        } else if (fechaDef.matches.length !== MATCHES_PER_FECHA) { // Should be caught by !fechaDef check earlier if matches are missing
            showFeedbackMessage(gameScreenMessage, `Definición de partidos incompleta para Fecha ${fechaNumber}. Contacta al administrador.`, 'error', false);
            savePredictionsBtn.disabled = true;
            // Render placeholders if not defined but not played yet, so UI isn't empty
            Array(MATCHES_PER_FECHA).fill(null).forEach((_, i) => {
                 const matchId = `match-${fechaNumber}-${i}`;
                 const matchItem = document.createElement('div');
                 matchItem.classList.add('match-prediction-item');
                 matchItem.innerHTML = `<p id="${matchId}-label">Equipo ${i*2+1} vs Equipo ${i*2+2} (No definido)</p><div class="options-group" role="radiogroup"></div>`;
                 const optionsGroup = matchItem.querySelector('.options-group') as HTMLElement;
                 (['LOCAL', 'EMPATE', 'VISITA'] as const).forEach(option => {
                    const radioId = `${matchId}-${option.toLowerCase()}`;
                    const radioInput = document.createElement('input');
                    radioInput.type = 'radio'; radioInput.id = radioId; radioInput.name = matchId; radioInput.value = option; radioInput.required = true; radioInput.disabled = true;
                    const radioLabel = document.createElement('label');
                    radioLabel.htmlFor = radioId; radioLabel.textContent = option;
                    optionsGroup.appendChild(radioInput); optionsGroup.appendChild(radioLabel);
                 });
                 matchesList.appendChild(matchItem);
            });
            return; 
        }


        fechaDef.matches.forEach((match, i) => {
            const matchId = `match-${fechaNumber}-${i}`;
            const existingPrediction = userPredictionsForThisFecha?.predictions.find(p => p.matchLabel === `${match.localTeam} vs ${match.visitorTeam}`);

            const matchItem = document.createElement('div');
            matchItem.classList.add('match-prediction-item');
            matchItem.setAttribute('aria-labelledby', `${matchId}-label`);

            const matchLabelEl = document.createElement('p');
            matchLabelEl.id = `${matchId}-label`;
            matchLabelEl.textContent = `${match.localTeam} vs ${match.visitorTeam}`;
            matchItem.appendChild(matchLabelEl);

            const optionsGroup = document.createElement('div');
            optionsGroup.classList.add('options-group');
            optionsGroup.setAttribute('role', 'radiogroup');
            optionsGroup.setAttribute('aria-labelledby', `${matchId}-label`);

            (['LOCAL', 'EMPATE', 'VISITA'] as const).forEach(option => {
                const radioId = `${matchId}-${option.toLowerCase()}`;
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.id = radioId;
                radioInput.name = matchId; 
                radioInput.value = option;
                radioInput.required = true;
                if (existingPrediction && existingPrediction.prediction === option) {
                    radioInput.checked = true;
                }
                radioInput.disabled = !!userPredictionsForThisFecha; // Disable if user already played

                const radioLabel = document.createElement('label');
                radioLabel.htmlFor = radioId;
                radioLabel.textContent = option;

                optionsGroup.appendChild(radioInput);
                optionsGroup.appendChild(radioLabel);
            });
            matchItem.appendChild(optionsGroup);
            matchesList.appendChild(matchItem);
        });
    };

    // --- History Screen Functions ---
    const displayPredictionHistory = () => {
        if (!predictionsHistoryList || !noHistoryMessage || !currentUser) return;

        predictionsHistoryList.innerHTML = '';
        const allHistory = getPredictionHistoryFromStorage();
        const userHistory = allHistory.filter(set => set.userId === currentUser!.usuario);

        if (userHistory.length === 0) {
            noHistoryMessage.style.display = 'block';
        } else {
            noHistoryMessage.style.display = 'none';
            userHistory.sort((a, b) => {
                if (a.fechaNumber !== b.fechaNumber) {
                    return a.fechaNumber - b.fechaNumber;
                }
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            userHistory.forEach(set => {
                const historyItemDiv = document.createElement('div');
                historyItemDiv.classList.add('prediction-history-item');

                const title = document.createElement('h3');
                title.textContent = `Fecha ${set.fechaNumber} - Predicciones del ${new Date(set.timestamp).toLocaleString()}`;
                historyItemDiv.appendChild(title);

                const list = document.createElement('ul');
                set.predictions.forEach(p => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<strong>${p.matchLabel}:</strong> ${p.prediction}`;
                    list.appendChild(listItem);
                });
                historyItemDiv.appendChild(list);
                predictionsHistoryList.appendChild(historyItemDiv);
            });
        }
    };

    // --- Event Listeners ---
    if (showRegisterLink && loginForm && registerForm) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active-form');
            registerForm.classList.add('active-form');
            clearAllFormErrors(loginForm);
            registerForm.reset();
        });
    }

    if (showLoginLink && loginForm && registerForm) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.remove('active-form');
            loginForm.classList.add('active-form');
            clearAllFormErrors(registerForm);
            loginForm.reset();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearAllFormErrors(loginForm);
            if (!validateForm(loginForm)) return;

            const formData = new FormData(loginForm);
            const loginUsuario = formData.get('login-usuario') as string;
            const loginContrasena = formData.get('login-contrasena') as string;

            if (loginUsuario === 'admin' && loginContrasena === 'adminab') {
                currentUser = { nombre: 'Administrador', usuario: 'admin', email: 'admin@example.com', hasActiveSubscription: true }; 
                showView('admin'); 
            } else {
                const users = getUsersFromStorage();
                const foundUser = users.find(user => user.usuario === loginUsuario);

                if (foundUser) { 
                    currentUser = { ...foundUser, hasActiveSubscription: foundUser.hasActiveSubscription || false };
                    showView('userMenu');
                } else {
                    const loginUserInput = loginForm.elements.namedItem('login-usuario') as HTMLInputElement | null;
                    const loginPassInput = loginForm.elements.namedItem('login-contrasena') as HTMLInputElement | null;
                    if(loginUserInput) displayError(loginUserInput, 'Usuario o contraseña incorrectos.');
                    if(loginPassInput) displayError(loginPassInput, ' '); 
                }
            }
            loginForm.reset();
        });

        const loginInputs = loginForm.querySelectorAll('input[required], input[type="email"]');
        loginInputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input as HTMLInputElement));
            input.addEventListener('input', () => clearError(input as HTMLInputElement));
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearAllFormErrors(registerForm);
            if (!validateForm(registerForm)) return;

            const formData = new FormData(registerForm);
            const newUser: User = {
                nombre: formData.get('register-nombre') as string,
                usuario: formData.get('register-usuario') as string,
                email: formData.get('register-email') as string,
                telefono: formData.get('register-telefono') as string || undefined,
                hasActiveSubscription: false
            };

            const users = getUsersFromStorage();
            if (users.some(user => user.usuario === newUser.usuario)) {
                 displayError(registerForm.elements.namedItem('register-usuario') as HTMLInputElement, 'Este nombre de usuario ya está en uso.');
                return;
            }
            if (users.some(user => user.email === newUser.email)) {
                displayError(registerForm.elements.namedItem('register-email') as HTMLInputElement, 'Este email ya está registrado.');
                return;
            }

            users.push(newUser);
            saveUsersToStorage(users);

            alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            registerForm.reset();
            clearAllFormErrors(registerForm);
            registerForm.classList.remove('active-form');
            if(loginForm) loginForm.classList.add('active-form');
        });

        const registerInputs = registerForm.querySelectorAll('input[required], input[type="email"], input[type="password"]');
        registerInputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input as HTMLInputElement));
            input.addEventListener('input', () => clearError(input as HTMLInputElement));
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            currentUser = null;
            showView('auth');
        });
    }
    
    if (btnShowRegisteredUsers && registeredUsersSection) {
        btnShowRegisteredUsers.addEventListener('click', () => {
            displayRegisteredUsers();
            registeredUsersSection.style.display = 'block';
        });
    }

    if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', () => {
            currentUser = null;
            showView('auth');
        });
    }
    
    if (btnGoToDefineMatches) {
        btnGoToDefineMatches.addEventListener('click', () => showView('defineMatches'));
    }
    if (btnGoToLoadResults) {
        btnGoToLoadResults.addEventListener('click', () => showView('loadResults'));
    }
    if (defineMatchesBackBtn) {
        defineMatchesBackBtn.addEventListener('click', () => showView('admin'));
    }
    if (resultsBackBtn) {
        resultsBackBtn.addEventListener('click', () => showView('admin'));
    }
    if (defineFechaSelect) {
        defineFechaSelect.addEventListener('change', () => {
            renderMatchDefinitionInputs(parseInt(defineFechaSelect.value));
            if (defineMatchesFeedback) defineMatchesFeedback.style.display = 'none'; // Hide old feedback
        });
    }
    if (defineMatchesForm) {
        defineMatchesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSaveMatchDefinitions();
        });
    }
    
    if (closePredictionsBtn) {
        closePredictionsBtn.addEventListener('click', () => {
            if (!defineFechaSelect) return;
            const fechaNumber = parseInt(defineFechaSelect.value);
            let definitions = getFechaDefinitionsFromStorage();
            const defIndex = definitions.findIndex(d => d.fechaNumber === fechaNumber);

            if (defIndex > -1) {
                definitions[defIndex].predictionsOpen = false;
                saveFechaDefinitionsToStorage(definitions);
                showFeedbackMessage(defineMatchesFeedback, `Predicciones para Fecha ${fechaNumber} cerradas.`, 'success');
                renderMatchDefinitionInputs(fechaNumber); // Re-render to update status message and button
            } else {
                showFeedbackMessage(defineMatchesFeedback, `No se encontraron definiciones para Fecha ${fechaNumber} para cerrar.`, 'error');
            }
        });
    }


    if (resultsFechaSelect) {
        resultsFechaSelect.addEventListener('change', () => {
            renderOfficialResultsInputs(parseInt(resultsFechaSelect.value));
             if (loadResultsFeedback) loadResultsFeedback.style.display = 'none'; // Hide old feedback
        });
    }
    if (loadResultsForm) {
        loadResultsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSaveOfficialResults();
        });
    }


    if (btnJugar) {
        btnJugar.addEventListener('click', () => {
            if (!currentUser) return;
            if (currentUser.hasActiveSubscription) {
                const userPredictions = getPredictionHistoryFromStorage().filter(p => p.userId === currentUser!.usuario);
                const definitions = getFechaDefinitionsFromStorage();
                let nextFechaToPlay = -1;

                for (let i = 1; i <= TOTAL_FECHAS; i++) {
                    const hasPlayedThisFecha = userPredictions.some(p => p.fechaNumber === i);
                    if (hasPlayedThisFecha) continue; 

                    const fechaDef = definitions.find(def => def.fechaNumber === i);

                    if (fechaDef && fechaDef.matches.length === MATCHES_PER_FECHA && fechaDef.predictionsOpen === true) {
                        nextFechaToPlay = i;
                        break;
                    }
                }

                if (nextFechaToPlay === -1) {
                     const userHasPlayedAnyFecha = userPredictions.length > 0;
                     if (userHasPlayedAnyFecha) {
                        alert("¡Felicidades! Has completado todas las fechas disponibles o no hay más fechas abiertas para jugar.");
                     } else {
                        alert("No hay fechas disponibles para jugar en este momento. Por favor, verifica que el administrador haya configurado los partidos y abierto las predicciones.");
                     }
                     showView('userMenu'); // Navigate to user menu if no game can be started
                     return;
                }

                currentPlayingFecha = nextFechaToPlay;
                renderGameMatches(currentPlayingFecha); 
                showView('game');
            } else {
                showView('payment');
            }
        });
    }

    if (mpPaymentLinkBtn) {
        // Href is set in HTML
    }

    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', () => {
            if (currentUser) {
                currentUser.hasActiveSubscription = true;
                const users = getUsersFromStorage();
                const userIndex = users.findIndex(u => u.usuario === currentUser!.usuario);
                if (userIndex > -1) {
                    users[userIndex].hasActiveSubscription = true;
                    saveUsersToStorage(users);
                }
                if(btnJugar) btnJugar.click(); 
            }
        });
    }
    
    if (paymentBackToMenuBtn) {
        paymentBackToMenuBtn.addEventListener('click', () => showView('userMenu'));
    }

    if (predictionsForm) {
        predictionsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentUser || currentPlayingFecha === null) return;

            const history = getPredictionHistoryFromStorage();
            const existingPredictionIndex = history.findIndex(
                pSet => pSet.userId === currentUser!.usuario && pSet.fechaNumber === currentPlayingFecha
            );

            if (existingPredictionIndex > -1) {
                alert("Ya has guardado tus predicciones para esta Fecha y no puedes modificarlas.");
                return; 
            }

            const definitions = getFechaDefinitionsFromStorage();
            const fechaDef = definitions.find(def => def.fechaNumber === currentPlayingFecha);
            if (!fechaDef) { 
                alert("Error: No se encontraron definiciones de partidos para esta fecha. No se pueden guardar predicciones.");
                return;
            }
             if (!fechaDef.predictionsOpen) { // Double check before saving
                alert("Las predicciones para esta Fecha están cerradas. No se pueden guardar.");
                showView('userMenu'); // Go back to menu
                return;
            }
             if (fechaDef.matches.length !== MATCHES_PER_FECHA) { 
                alert("Error: Las definiciones de partidos para esta fecha están incompletas. No se pueden guardar predicciones.");
                return;
            }


            const formData = new FormData(predictionsForm);
            const currentPredictions: MatchPrediction[] = [];
            let allPredicted = true;

            for (let i = 0; i < MATCHES_PER_FECHA; i++) {
                const matchId = `match-${currentPlayingFecha}-${i}`; 
                const predictionValue = formData.get(matchId) as 'LOCAL' | 'EMPATE' | 'VISITA' | null;
                
                if (!predictionValue) {
                    allPredicted = false;
                    break; 
                }
                currentPredictions.push({
                    matchLabel: `${fechaDef.matches[i].localTeam} vs ${fechaDef.matches[i].visitorTeam}`,
                    prediction: predictionValue
                });
            }

            if (!allPredicted) {
                alert('Debes realizar una predicción para todos los partidos.');
                return;
            }

            const newPredictionSet: PredictionSet = {
                userId: currentUser.usuario,
                fechaNumber: currentPlayingFecha,
                timestamp: new Date().toISOString(),
                predictions: currentPredictions
            };
            
            history.push(newPredictionSet); 
            savePredictionHistoryToStorage(history);

            alert(`Predicciones para Fecha ${currentPlayingFecha} guardadas exitosamente.`);
            if (predictionsForm) predictionsForm.reset();
            currentPlayingFecha = null;
            showView('userMenu'); 
        });
    }

    if (gameBackToMenuBtn) {
        gameBackToMenuBtn.addEventListener('click', () => {
            currentPlayingFecha = null;
            showView('userMenu');
        });
    }

    if (btnHistorialPredicciones) {
        btnHistorialPredicciones.addEventListener('click', () => showView('history'));
    }

    if (historyBackToMenuBtn) {
        historyBackToMenuBtn.addEventListener('click', () => showView('userMenu'));
    }

    // --- Initial View ---
    showView('auth');
});
