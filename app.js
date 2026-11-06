const Game = {
    state: {
        level: 1, 
        score: 0,
        streak: 0, 
        streakTarget: 3, 
        currentNumber: 0,
        currentTarget: '', 
        currentTargetValue: 10, 
        isAnswered: false
    },

    dinoEmojis: ['🦖', '🦕', '🦎', '🐊', '🐉', '🦴', '🥚'],

    places: [
        { val: 1, label: 'unidades', id: 'u' },
        { val: 10, label: 'decenas', id: 'd' },
        { val: 100, label: 'centenas', id: 'c' },
        { val: 1000, label: 'unidades de millar', id: 'um' },
        { val: 10000, label: 'decenas de millar', id: 'dm' },
        { val: 100000, label: 'centenas de millar', id: 'cm' }
    ],

    init: function() {
        this.randomizeHeaderDino();
        this.loadProgress();
        this.setupInputs();
        this.bindControls();
        this.setupCustomModalListener();
        this.nextQuestion();
    },

    bindControls: function() {
        document.getElementById('btn-reset').addEventListener('click', () => this.resetGame());
        document.getElementById('btn-check').addEventListener('click', () => this.checkAnswer());
        document.getElementById('btn-hint').addEventListener('click', () => this.showHint());
        document.getElementById('btn-solve').addEventListener('click', () => this.showSolution());
        document.getElementById('btn-custom').addEventListener('click', () => this.openCustomModal());
        document.getElementById('btn-next').addEventListener('click', () => this.nextQuestion());
        document.getElementById('btn-level-continue').addEventListener('click', () => this.closeModal());
        document.getElementById('btn-custom-start').addEventListener('click', () => this.setCustomNumber());
        document.getElementById('btn-custom-cancel').addEventListener('click', () => this.closeCustomModal());
    },

    randomizeHeaderDino: function() {
        const randomIndex = Math.floor(Math.random() * this.dinoEmojis.length);
        document.getElementById('dino-icon').textContent = this.dinoEmojis[randomIndex];
    },

    loadProgress: function() {
        try {
            const saved = localStorage.getItem('jurassicRoundGame_v5');
            if (saved) {
                const data = JSON.parse(saved);
                this.state.level = data.level || 1;
                this.state.score = data.score || 0;
            }
        } catch (e) {
            console.warn("Modo Sandbox: Sin persistencia.");
        }
        this.updateStats();
    },

    saveProgress: function() {
        try {
            localStorage.setItem('jurassicRoundGame_v5', JSON.stringify({
                level: this.state.level,
                score: this.state.score
            }));
        } catch (e) {}
    },

    resetGame: function() {
        if(!confirm("¿Estás seguro de que quieres reiniciar todo el progreso?")) return;
        
        try {
            localStorage.removeItem('jurassicRoundGame_v5');
        } catch (e) {}
        
        this.state.level = 1;
        this.state.score = 0;
        this.state.streak = 0;
        this.state.isAnswered = false;
        
        this.randomizeHeaderDino();
        this.updateStats();
        this.nextQuestion();
        this.showFeedback("Sistema reiniciado. Bienvenido de nuevo al parque.", "neutral");
    },

    setupInputs: function() {
        const inputs = document.querySelectorAll('input[type="text"]');
        const inputOrder = [
            'src-m', 'src-cm', 'src-dm', 'src-um', 'src-c', 'src-d', 'src-u',
            'res-m', 'res-cm', 'res-dm', 'res-um', 'res-c', 'res-d', 'res-u'
        ];

        inputs.forEach(inp => {
            inp.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                if (e.target.value.length === 1) {
                    const currentId = e.target.id;
                    const currentIndex = inputOrder.indexOf(currentId);
                    if (currentIndex !== -1 && currentIndex < inputOrder.length - 1) {
                        const nextId = inputOrder[currentIndex + 1];
                        const nextElement = document.getElementById(nextId);
                        if (nextElement) {
                            nextElement.focus();
                            nextElement.select();
                        }
                    }
                }
            });

            inp.addEventListener('keydown', (e) => {
                if(e.key === "Enter") this.checkAnswer();
            });
        });
    },

    // --- LÓGICA DE NÚMERO PERSONALIZADO ---
    setupCustomModalListener: function() {
        const input = document.getElementById('custom-input-number');
        const select = document.getElementById('custom-target-select');

        input.addEventListener('input', (e) => {
            const rawValue = e.target.value;
            const val = Number(rawValue);
            select.innerHTML = ''; // Limpiar opciones

            if (rawValue === '' || !Number.isInteger(val) || val < 10 || val > 999999) {
                const opt = document.createElement('option');
                opt.text = val > 999999 ? "El número no puede superar 999 999" : val > 0 && val < 10 ? "El número debe ser al menos 10" : "-- Escribe un número entero válido --";
                select.add(opt);
                select.disabled = true;
                return;
            }

            select.disabled = false;
            // Filtrar lugares válidos (ej: si es 50, solo decenas. Si es 150, decenas y centenas)
            const validPlaces = this.places.filter(p => p.val > 1 && p.val <= val);
            
            validPlaces.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.val;
                opt.text = p.label.charAt(0).toUpperCase() + p.label.slice(1); // Capitalizar
                select.add(opt);
            });
        });
    },

    openCustomModal: function() {
        document.getElementById('custom-modal').style.display = 'flex';
        document.getElementById('custom-input-number').value = '';
        document.getElementById('custom-target-select').innerHTML = '<option>-- Escribe un número primero --</option>';
        document.getElementById('custom-target-select').disabled = true;
        document.getElementById('custom-input-number').focus();
    },

    closeCustomModal: function() {
        document.getElementById('custom-modal').style.display = 'none';
    },

    setCustomNumber: function() {
        const input = document.getElementById('custom-input-number');
        const select = document.getElementById('custom-target-select');
        const numVal = Number(input.value);
        const targetVal = Number(select.value);
        const placeObj = this.places.find(p => p.val === targetVal);

        if (!input.value || !Number.isInteger(numVal) || numVal < 10 || numVal > 999999) {
            alert("Introduce un número entero entre 10 y 999 999.");
            return;
        }
        if (!placeObj || targetVal > numVal) {
            alert("Selecciona una posición válida para ese número.");
            return;
        }

        // Configurar juego con valores personalizados
        this.state.isAnswered = false;
        this.resetUI();
        
        this.state.currentNumber = numVal;
        this.state.currentTargetValue = targetVal;
        this.state.currentTarget = placeObj.label;

        // Actualizar UI
        document.getElementById('question-number-display').textContent = this.formatNumber(this.state.currentNumber);
        document.getElementById('question-target-display').textContent = this.state.currentTarget;
        document.getElementById('table-original-number').textContent = this.formatNumber(this.state.currentNumber);
        
        document.querySelectorAll('input[type="text"]').forEach(i => i.value = '');
        
        this.closeCustomModal();
    },
    // -------------------------------------

    nextQuestion: function() {
        this.state.isAnswered = false;
        this.resetUI();

        const digits = this.state.level + 1; 
        let min = Math.pow(10, digits - 1);
        if (min < 11) min = 11; 
        const max = Math.pow(10, digits) - 1;

        this.state.currentNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        const validPlaces = this.places.filter(p => p.val > 1 && p.val <= this.state.currentNumber);
        
        const targetPlace = validPlaces.length > 0 
            ? validPlaces[Math.floor(Math.random() * validPlaces.length)] 
            : this.places[1];

        this.state.currentTarget = targetPlace.label;
        this.state.currentTargetValue = targetPlace.val;

        document.getElementById('question-number-display').textContent = this.formatNumber(this.state.currentNumber);
        document.getElementById('question-target-display').textContent = this.state.currentTarget;
        document.getElementById('table-original-number').textContent = this.formatNumber(this.state.currentNumber);
        
        document.querySelectorAll('input[type="text"]').forEach(i => i.value = '');
    },

    calculateCorrectAnswer: function() {
        const n = this.state.currentNumber;
        const p = this.state.currentTargetValue;
        return Math.round(n / p) * p;
    },

    readNumberFromRow: function(prefix) {
        const ids = ['m', 'cm', 'dm', 'um', 'c', 'd', 'u'];
        let total = 0;
        let isEmpty = true;
        
        ids.forEach(suffix => {
            const el = document.getElementById(`${prefix}-${suffix}`);
            if(el.value !== '') {
                isEmpty = false;
                let mult = 1;
                if(suffix === 'm') mult = 1000000;
                if(suffix === 'd') mult = 10;
                if(suffix === 'c') mult = 100;
                if(suffix === 'um') mult = 1000;
                if(suffix === 'dm') mult = 10000;
                if(suffix === 'cm') mult = 100000;
                total += parseInt(el.value) * mult;
            }
        });
        return { val: total, isEmpty: isEmpty };
    },

    checkAnswer: function() {
        if (this.state.isAnswered) return;

        // PASO 1: Validar descomposición
        const row1 = this.readNumberFromRow('src');
        
        if (row1.isEmpty) {
            this.showFeedback("Paso 1: Primero coloca las cifras del número original en la primera fila.", "warning");
            return;
        }

        if (row1.val !== this.state.currentNumber) {
            this.showFeedback(`Paso 1 Incorrecto: Has escrito mal el número original. Revisa las cifras.`, "warning");
            return;
        }

        // PASO 2: Validar redondeo
        const row2 = this.readNumberFromRow('res');
        if (row2.isEmpty) {
            this.showFeedback("Paso 2: ¡Bien colocado! Ahora escribe el número redondeado en la segunda fila.", "warning");
            return;
        }
        const userResultVal = row2.val;

        const correctNum = this.calculateCorrectAnswer();

        this.state.isAnswered = true;
        const btnNext = document.getElementById('btn-next');
        const btnCheck = document.getElementById('btn-check');

        if (userResultVal === correctNum) {
            this.state.score++;
            this.state.streak++;
            this.showFeedback(`¡Excelente! ${this.state.currentNumber} redondeado a ${this.state.currentTarget} es ${this.formatNumber(correctNum)}.`, "success");
            
            if (this.state.streak >= this.state.streakTarget && this.state.level < 5) {
                this.showLevelModal();
            } else {
                btnCheck.style.display = 'none';
                btnNext.style.display = 'inline-block';
                btnNext.focus();
            }
            
            this.saveProgress();
            this.updateStats();

        } else {
            this.state.streak = 0;
            this.updateStats();
            this.showFeedback(`Has colocado bien el número, pero el redondeo no es correcto. Inténtalo de nuevo o mira la solución.`, "error");
            this.state.isAnswered = false; 
        }
    },

    showLevelModal: function() {
        const modal = document.getElementById('level-modal');
        modal.style.display = 'flex';
    },

    closeModal: function() {
        const modal = document.getElementById('level-modal');
        modal.style.display = 'none';
        this.state.level++;
        this.state.streak = 0;
        this.updateStats();
        this.saveProgress();
        this.nextQuestion();
    },

    showHint: function() {
        const placeVal = this.state.currentTargetValue;
        const digitToCheckVal = placeVal / 10;
        const digit = Math.floor((this.state.currentNumber / digitToCheckVal) % 10);
        
        let msg = `Para redondear a las <b>${this.state.currentTarget}</b>, fíjate en la cifra anterior.<br>`;
        msg += `En ${this.formatNumber(this.state.currentNumber)}, esa cifra es <b>${digit}</b>.<br>`;
        msg += digit >= 5 ? "¡Es 5 o más! Tienes que subir." : "¡Es menos de 5! Se queda igual.";
        
        this.showFeedback(msg, "neutral");
        document.getElementById('btn-solve').style.display = 'inline-block';
    },

    showSolution: function() {
        const correct = this.calculateCorrectAnswer();
        this.showFeedback(`<strong>Solución: ${this.formatNumber(correct)}</strong>`, "neutral");
        
        const strVal = correct.toString();
        const map = ['res-u', 'res-d', 'res-c', 'res-um', 'res-dm', 'res-cm', 'res-m'];
        map.forEach(id => document.getElementById(id).value = '');
        
        for(let i=0; i < strVal.length; i++) {
            let char = strVal[strVal.length - 1 - i];
            if(i < map.length) document.getElementById(map[i]).value = char;
        }

        this.state.isAnswered = true;
        document.getElementById('btn-check').style.display = 'none';
        document.getElementById('btn-next').style.display = 'inline-block';
    },

    showFeedback: function(msg, type) {
        const el = document.getElementById('feedback-area');
        el.style.display = 'block';
        el.className = ''; 
        el.innerHTML = `<div class="explanation-text">${msg}</div>`;
        if (type === 'success') el.classList.add('feedback-success');
        else if (type === 'error') el.classList.add('feedback-error');
        else if (type === 'warning') el.classList.add('feedback-warning');
        else el.style.background = '#34495e';
    },

    resetUI: function() {
        document.getElementById('feedback-area').style.display = 'none';
        document.getElementById('btn-check').style.display = 'inline-block';
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('btn-solve').style.display = 'none';
    },

    updateStats: function() {
        document.getElementById('level-display').textContent = `Nivel: ${this.state.level}`;
        document.getElementById('score-display').textContent = `Aciertos: ${this.state.score}`;
        document.getElementById('streak-display').textContent = `Racha: ${this.state.streak}/${this.state.streakTarget}`;
    },

    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
};

Game.init();
