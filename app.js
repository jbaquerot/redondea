const Game = {
    state: {
        level: 1, score: 0, streak: 0, streakTarget: 3,
        mode: null, playerName: '', currentNumber: 0,
        currentTarget: '', currentTargetValue: 10, isAnswered: false
    },
    dinoEmojis: ['🦖', '🦕', '🦎', '🐊', '🐉', '🦴', '🥚'],
    integerPlaces: [
        { val: 10000000, label: 'decenas de millón', id: 'dmi' }, { val: 1000000, label: 'millones', id: 'm' },
        { val: 100000, label: 'centenas de millar', id: 'cm' }, { val: 10000, label: 'decenas de millar', id: 'dm' },
        { val: 1000, label: 'unidades de millar', id: 'um' }, { val: 100, label: 'centenas', id: 'c' },
        { val: 10, label: 'decenas', id: 'd' }
    ],
    decimalPlaces: [
        { val: 1000000, label: 'millares', id: 'um' }, { val: 100000, label: 'centenas', id: 'c' },
        { val: 10000, label: 'decenas', id: 'd' }, { val: 1000, label: 'unidades', id: 'u' },
        { val: 100, label: 'décimas', id: 'tenths' }, { val: 10, label: 'centésimas', id: 'hundredths' }
    ],
    digitIds: ['dmi', 'm', 'cm', 'dm', 'um', 'c', 'd', 'u', 'tenths', 'hundredths', 'thousandths'],
    init() {
        this.randomizeHeaderDino(); this.loadProgress(); this.setupInputs(); this.bindControls(); this.setupCustomModalListener();
    },
    get places() { return this.state.mode === 'decimal' ? this.decimalPlaces : this.integerPlaces; },
    bindControls() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
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
    randomizeHeaderDino() {
        document.getElementById('dino-icon').textContent = this.dinoEmojis[Math.floor(Math.random() * this.dinoEmojis.length)];
    },
    startGame() {
        const selected = [...document.querySelectorAll('input[name="game-mode"]')].find(input => input.checked);
        if (!selected) { this.showFeedback('Elige primero si quieres practicar con números enteros o decimales.', 'warning'); return; }
        this.state.mode = selected.value;
        this.state.playerName = document.getElementById('player-name').value.trim().slice(0, 40);
        document.body.classList.toggle('decimal-mode', this.state.mode === 'decimal');
        document.getElementById('start-screen').hidden = true;
        document.getElementById('game-board').hidden = false;
        this.nextQuestion();
        this.showFeedback(this.greet('¡Bienvenido a la expedición!') , 'neutral');
    },
    greet(message) { return this.state.playerName ? `${this.escapeHTML(this.state.playerName)}, ${message[0].toLowerCase()}${message.slice(1)}` : message; },
    escapeHTML(value) { return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); },
    loadProgress() {
        try {
            const saved = localStorage.getItem('jurassicRoundGame_v5');
            if (saved) {
                const data = JSON.parse(saved);
                if (Number.isInteger(data.level) && data.level >= 1 && data.level <= 5) this.state.level = data.level;
                if (Number.isInteger(data.score) && data.score >= 0) this.state.score = data.score;
            }
        } catch (e) { console.warn('No se pudo cargar el progreso guardado.'); }
        this.updateStats();
    },
    saveProgress() {
        try { localStorage.setItem('jurassicRoundGame_v5', JSON.stringify({ level: this.state.level, score: this.state.score })); } catch (e) {}
    },
    resetGame() {
        if (!confirm('¿Estás seguro de que quieres reiniciar todo el progreso?')) return;
        try { localStorage.removeItem('jurassicRoundGame_v5'); } catch (e) {}
        this.state.level = 1; this.state.score = 0; this.state.streak = 0; this.state.isAnswered = false;
        this.state.currentNumber = 0; this.state.currentTarget = ''; this.state.currentTargetValue = 10;
        this.state.mode = null; this.state.playerName = '';
        document.getElementById('player-name').value = '';
        document.querySelectorAll('input[name="game-mode"]').forEach(input => { input.checked = false; });
        document.body.classList.toggle('decimal-mode', false);
        document.getElementById('start-screen').hidden = false;
        document.getElementById('game-board').hidden = true;
        this.resetUI();
        this.randomizeHeaderDino(); this.updateStats();
        document.getElementById('player-name').focus();
    },
    setupInputs() {
        const ids = [...this.digitIds.map(id => `src-${id}`), ...this.digitIds.map(id => `res-${id}`)];
        ids.forEach(id => {
            const inp = document.getElementById(id);
            inp.addEventListener('input', e => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
                const activePlaces = this.state.mode === 'decimal' ? this.digitIds : this.digitIds.slice(0, 8);
                const order = [...activePlaces.map(place => `src-${place}`), ...activePlaces.map(place => `res-${place}`)];
                const nextId = order[order.indexOf(id) + 1];
                if (e.target.value && nextId) { const next = document.getElementById(nextId); next.focus(); next.select(); }
            });
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') this.checkAnswer(); });
        });
    },
    parseDecimal(raw) {
        const normalized = String(raw).trim().replace(/\s/g, '');
        if (!/^(?:\d+)(?:,\d{1,3})?$/.test(normalized)) return null;
        const [whole, fraction = ''] = normalized.split(',');
        const value = Number(whole) * 1000 + Number((fraction + '000').slice(0, 3));
        return Number.isSafeInteger(value) && value <= 9999999 ? value : null;
    },
    getValidPlaces(value) {
        return this.places.filter(place => this.state.mode === 'decimal'
            ? place.val <= 1000 || place.val <= value
            : place.val <= Math.max(value, 10) || (place.val === 10000000 && value >= 5000000));
    },
    maxNumberForLevel() {
        const limits = this.state.mode === 'decimal'
            ? [99999, 999999, 9999999, 9999999, 9999999]
            : [99, 999, 9999, 99999, 9999999];
        return limits[Math.min(this.state.level, 5) - 1];
    },
    formatNumber(value) {
        if (this.state.mode !== 'decimal') return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        const whole = Math.floor(value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        const fraction = String(value % 1000).padStart(3, '0').replace(/0+$/, '');
        return fraction ? `${whole},${fraction}` : whole;
    },
    setupCustomModalListener() {
        const input = document.getElementById('custom-input-number'), select = document.getElementById('custom-target-select');
        input.addEventListener('input', () => this.updateCustomPlaces());
    },
    updateCustomPlaces() {
        const input = document.getElementById('custom-input-number'), select = document.getElementById('custom-target-select');
        const raw = input.value.trim();
        select.innerHTML = '';
        const val = this.state.mode === 'decimal' ? this.parseDecimal(raw) : (/^\d+$/.test(raw) ? Number(raw) : null);
        if (val === null || val < 0 || val > 9999999) {
            const opt = document.createElement('option');
            opt.text = this.state.mode === 'decimal' ? 'Usa un número entre 0 y 9 999,999 (hasta tres decimales)' : 'Escribe un entero entre 0 y 9 999 999';
            select.add(opt); select.disabled = true; return;
        }
        const valid = this.getValidPlaces(val);
        valid.forEach(place => { const opt = document.createElement('option'); opt.value = place.val; opt.text = place.label[0].toUpperCase() + place.label.slice(1); select.add(opt); });
        select.disabled = valid.length === 0;
    },
    openCustomModal() {
        if (!this.state.mode) return;
        document.getElementById('custom-modal').style.display = 'flex';
        document.getElementById('custom-input-number').value = '';
        document.getElementById('custom-target-select').innerHTML = '<option>-- Escribe un número primero --</option>';
        document.getElementById('custom-target-select').disabled = true;
        document.getElementById('custom-input-number').focus();
    },
    closeCustomModal() { document.getElementById('custom-modal').style.display = 'none'; },
    setCustomNumber() {
        const input = document.getElementById('custom-input-number'), select = document.getElementById('custom-target-select');
        const raw = input.value.trim();
        const num = this.state.mode === 'decimal' ? this.parseDecimal(raw) : (/^\d+$/.test(raw) ? Number(raw) : null);
        const target = Number(select.value), place = this.places.find(p => p.val === target);
        const max = 9999999;
        if (num === null || num < 0 || num > max) { alert(this.state.mode === 'decimal' ? 'Introduce un decimal entre 0 y 9 999,999 con hasta tres cifras decimales.' : 'Introduce un entero entre 0 y 9 999 999.'); return; }
        if (!place || !this.getValidPlaces(num).some(validPlace => validPlace.val === target)) { alert('Selecciona una posición válida para ese número.'); return; }
        this.state.isAnswered = false; this.resetUI(); this.state.currentNumber = num;
        this.state.currentTargetValue = target; this.state.currentTarget = place.label;
        this.renderQuestion(); this.clearDigits(); this.closeCustomModal();
    },
    nextQuestion() {
        if (!this.state.mode) return;
        this.state.isAnswered = false; this.resetUI();
        const max = this.maxNumberForLevel();
        this.state.currentNumber = Math.floor(Math.random() * (max + 1));
        const valid = this.getValidPlaces(this.state.currentNumber);
        const target = valid[Math.floor(Math.random() * valid.length)];
        this.state.currentTarget = target.label; this.state.currentTargetValue = target.val;
        this.renderQuestion(); this.clearDigits();
    },
    renderQuestion() {
        document.getElementById('question-number-display').textContent = this.formatNumber(this.state.currentNumber);
        document.getElementById('question-target-display').textContent = this.state.currentTarget;
        document.getElementById('table-original-number').textContent = this.formatNumber(this.state.currentNumber);
    },
    clearDigits() { this.digitIds.forEach(id => { document.getElementById(`src-${id}`).value = ''; document.getElementById(`res-${id}`).value = ''; }); },
    calculateCorrectAnswer() {
        const n = this.state.currentNumber, p = this.state.currentTargetValue;
        return Math.floor((n + p / 2) / p) * p;
    },
    readNumberFromRow(prefix) {
        let total = 0, isEmpty = true;
        this.digitIds.forEach((id, index) => {
            if (this.state.mode !== 'decimal' && index > 7) return;
            const el = document.getElementById(`${prefix}-${id}`);
            if (el.value !== '') {
                isEmpty = false;
                const decimalWeights = [10000000000, 1000000000, 100000000, 10000000, 1000000, 100000, 10000, 1000, 100, 10, 1];
                const integerWeights = [10000000, 1000000, 100000, 10000, 1000, 100, 10, 1];
                total += Number(el.value) * (this.state.mode === 'decimal' ? decimalWeights[index] : integerWeights[index]);
            }
        });
        return { val: total, isEmpty };
    },
    checkAnswer() {
        if (!this.state.mode || this.state.isAnswered) return;
        const row1 = this.readNumberFromRow('src');
        if (row1.isEmpty) { this.showFeedback(this.greet('Primero coloca las cifras del número original en la primera fila. ¡Tú puedes!'), 'warning'); return; }
        if (row1.val !== this.state.currentNumber) { this.showFeedback(this.greet('El número original no coincide. Revisa sus cifras y vuelve a intentarlo; aprender también es corregir.'), 'warning'); return; }
        const row2 = this.readNumberFromRow('res');
        if (row2.isEmpty) { this.showFeedback(this.greet('Has colocado bien el número. Completa ahora el resultado redondeado; vas muy bien.'), 'warning'); return; }
        const correct = this.calculateCorrectAnswer();
        if (row2.val === correct) {
            this.state.isAnswered = true; this.state.score++; this.state.streak++;
            this.showFeedback(this.greet(`¡Excelente! ${this.formatNumber(this.state.currentNumber)} redondeado a ${this.state.currentTarget} es ${this.formatNumber(correct)}.`), 'success');
            if (this.state.streak >= this.state.streakTarget && this.state.level < 5) this.showLevelModal();
            else { document.getElementById('btn-check').style.display = 'none'; document.getElementById('btn-next').style.display = 'inline-block'; document.getElementById('btn-next').focus(); }
            this.saveProgress(); this.updateStats();
        } else {
            this.state.streak = 0; this.updateStats();
            this.showFeedback(this.greet(`Has colocado bien el número, pero el redondeo correcto es ${this.formatNumber(correct)}. Revisa la cifra siguiente e inténtalo otra vez. ¡Ánimo!`), 'error');
        }
    },
    showLevelModal() { document.getElementById('level-modal').style.display = 'flex'; },
    closeModal() { document.getElementById('level-modal').style.display = 'none'; this.state.level++; this.state.streak = 0; this.updateStats(); this.saveProgress(); this.nextQuestion(); },
    showHint() {
        const divisor = this.state.currentTargetValue / 10;
        const digit = Math.floor(this.state.currentNumber / divisor) % 10;
        this.showFeedback(`Para redondear a las <b>${this.state.currentTarget}</b>, fíjate en la cifra siguiente. En ${this.formatNumber(this.state.currentNumber)}, esa cifra es <b>${digit}</b>. ${digit >= 5 ? 'Es 5 o más: subimos.' : 'Es menor que 5: se mantiene.'}`, 'neutral');
        document.getElementById('btn-solve').style.display = 'inline-block';
    },
    showSolution() {
        const correct = this.calculateCorrectAnswer(); this.showFeedback(`<strong>Solución: ${this.formatNumber(correct)}</strong>`, 'neutral');
        this.digitIds.forEach(id => { document.getElementById(`res-${id}`).value = ''; });
        const places = String(correct).padStart(this.state.mode === 'decimal' ? 11 : 8, '0');
        this.digitIds.forEach((id, index) => {
            if (this.state.mode === 'decimal') document.getElementById(`res-${id}`).value = places[index];
            else if (index < 8) document.getElementById(`res-${id}`).value = places[index];
        });
        this.state.isAnswered = true; document.getElementById('btn-check').style.display = 'none'; document.getElementById('btn-next').style.display = 'inline-block';
    },
    showFeedback(msg, type) {
        const el = document.getElementById('feedback-area'); el.style.display = 'block'; el.className = '';
        el.innerHTML = `<div class="explanation-text">${msg}</div>`;
        if (type === 'success') el.classList.add('feedback-success'); else if (type === 'error') el.classList.add('feedback-error'); else if (type === 'warning') el.classList.add('feedback-warning'); else el.style.background = '#34495e';
    },
    resetUI() { document.getElementById('feedback-area').style.display = 'none'; document.getElementById('btn-check').style.display = 'inline-block'; document.getElementById('btn-next').style.display = 'none'; document.getElementById('btn-solve').style.display = 'none'; },
    updateStats() {
        document.getElementById('level-display').textContent = `Nivel: ${this.state.level}`;
        document.getElementById('score-display').textContent = `Aciertos: ${this.state.score}`;
        document.getElementById('streak-display').textContent = `Racha: ${this.state.streak}/${this.state.streakTarget}`;
    }
};
Game.init();
