const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

class MockElement {
    constructor(id, tagName = 'div') {
        this.id = id;
        this.tagName = tagName;
        this.value = '';
        this.textContent = '';
        this._innerHTML = '';
        this.style = {};
        this.disabled = false;
        this.checked = false;
        this.hidden = false;
        this.listeners = {};
        this.options = [];
        this.className = '';
        this.classList = {
            add: (...names) => {
                const current = new Set(this.className.split(/\s+/).filter(Boolean));
                names.forEach(name => current.add(name));
                this.className = [...current].join(' ');
            }
        };
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(value) { this._innerHTML = value; this.options = []; }

    addEventListener(name, callback) {
        (this.listeners[name] ||= []).push(callback);
    }

    dispatch(name, extra = {}) {
        for (const callback of this.listeners[name] || []) {
            callback({ target: this, key: '', ...extra });
        }
    }

    add(option) {
        this.options.push(option);
        if (this.options.length === 1) this.value = option.value || '';
    }

    focus() { this.focused = true; }
    select() { this.selected = true; }
}

function createGame({ savedProgress = null, random = () => 0, autoStart = true } = {}) {
    const elements = new Map();
    for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) {
        if (!elements.has(id)) {
            const tag = html.match(new RegExp(`<([a-z]+)[^>]*\\bid="${id}"`))?.[1] || 'div';
            elements.set(id, new MockElement(id, tag));
        }
    }

    const textInputs = [...html.matchAll(/<input type="text" id="([^"]+)"/g)]
        .map(([, id]) => elements.get(id));
    const modes = [new MockElement('mode-integer', 'input'), new MockElement('mode-decimal', 'input')];
    modes[0].value = 'integer'; modes[1].value = 'decimal';
    const body = new MockElement('body');
    body.classList.toggle = (name, enabled) => { body.classList[name] = enabled; };
    elements.get('game-board').hidden = true;
    const localStore = new Map();
    if (savedProgress !== null) {
        localStore.set('jurassicRoundGame_v5', JSON.stringify(savedProgress));
    }
    const alerts = [];
    const document = {
        body,
        getElementById(id) {
            const element = elements.get(id);
            if (!element) throw new Error(`Elemento no encontrado: ${id}`);
            return element;
        },
        querySelectorAll(selector) {
            if (selector === 'input[type="text"]') return textInputs;
            if (selector === 'input[name="game-mode"]') return modes;
            throw new Error(`Selector no implementado: ${selector}`);
        },
        createElement(tag) { return new MockElement('', tag); }
    };
    const localStorage = {
        getItem(key) { return localStore.get(key) ?? null; },
        setItem(key, value) { localStore.set(key, String(value)); },
        removeItem(key) { localStore.delete(key); }
    };
    const math = Object.create(Math);
    math.random = random;
    const context = vm.createContext({
        document,
        body,
        localStorage,
        Math: math,
        confirm: () => true,
        alert: message => alerts.push(message),
        console: { warn() {} }
    });
    vm.runInContext(source, context, { filename: 'app.js' });
    const game = vm.runInContext('Game', context);
    if (autoStart) { modes[0].checked = true; game.startGame(); }
    return { game, elements, localStore, alerts, modes, body };
}

const placeIds = ['m', 'cm', 'dm', 'um', 'c', 'd', 'u'];
function enterDigits(elements, prefix, number) {
    const digits = String(number).padStart(7, '0');
    placeIds.forEach((place, index) => {
        elements.get(`${prefix}-${place}`).value = digits[index];
    });
}

function setQuestion(game, number, placeValue) {
    game.state.currentNumber = number;
    game.state.currentTargetValue = placeValue;
    game.state.currentTarget = game.places.find(place => place.val === placeValue).label;
}

test('redondea correctamente por debajo, en y por encima del umbral 5', () => {
    const { game } = createGame();
    const cases = [
        [24, 10, 20], [25, 10, 30], [26, 10, 30],
        [149, 100, 100], [150, 100, 200], [151, 100, 200],
        [1499, 1000, 1000], [1500, 1000, 2000]
    ];
    for (const [number, place, expected] of cases) {
        setQuestion(game, number, place);
        assert.equal(game.calculateCorrectAnswer(), expected, `${number} a ${place}`);
    }
});

test('permite representar y comprobar el resultado 1 000 000', () => {
    const { game, elements } = createGame();
    setQuestion(game, 999999, 100000);
    enterDigits(elements, 'src', 999999);
    enterDigits(elements, 'res', 1000000);

    game.checkAnswer();

    assert.equal(game.state.score, 1);
    assert.equal(game.state.isAnswered, true);
    assert.equal(elements.get('feedback-area').className, 'feedback-success');
    assert.equal(elements.get('btn-next').style.display, 'inline-block');
});

test('lee correctamente las siete posiciones decimales', () => {
    const { game, elements } = createGame();
    enterDigits(elements, 'src', 1234567);
    assert.deepEqual(JSON.parse(JSON.stringify(game.readNumberFromRow('src'))), {
        val: 1234567,
        isEmpty: false
    });
});

test('rechaza una descomposición incorrecta sin sumar aciertos', () => {
    const { game, elements } = createGame();
    setQuestion(game, 248, 10);
    enterDigits(elements, 'src', 249);
    enterDigits(elements, 'res', 250);

    game.checkAnswer();

    assert.equal(game.state.score, 0);
    assert.equal(game.state.isAnswered, false);
    assert.match(elements.get('feedback-area').innerHTML, /número original no coincide/);
});

test('permite reintentar tras un redondeo incorrecto y reinicia la racha', () => {
    const { game, elements } = createGame();
    setQuestion(game, 248, 10);
    game.state.streak = 2;
    enterDigits(elements, 'src', 248);
    enterDigits(elements, 'res', 240);
    game.checkAnswer();

    assert.equal(game.state.streak, 0);
    assert.equal(game.state.isAnswered, false);
    assert.equal(game.state.score, 0);

    enterDigits(elements, 'res', 250);
    game.checkAnswer();
    assert.equal(game.state.score, 1);
});

test('carga y persiste nivel y aciertos después de una respuesta correcta', () => {
    const { game, elements, localStore } = createGame({ savedProgress: { level: 2, score: 7 } });
    assert.equal(game.state.level, 2);
    assert.equal(game.state.score, 7);
    setQuestion(game, 125, 10);
    enterDigits(elements, 'src', 125);
    enterDigits(elements, 'res', 130);
    game.checkAnswer();

    assert.deepEqual(JSON.parse(localStore.get('jurassicRoundGame_v5')), { level: 2, score: 8 });
});

test('la pista identifica la cifra inmediatamente anterior a la posición', () => {
    const { game, elements } = createGame();
    setQuestion(game, 149, 100);
    game.showHint();

    assert.match(elements.get('feedback-area').innerHTML, /esa cifra es <b>4<\/b>/);
    assert.equal(elements.get('btn-solve').style.display, 'inline-block');
});

test('la solución rellena también la columna de millones', () => {
    const { game, elements } = createGame();
    setQuestion(game, 999999, 100000);
    game.showSolution();

    assert.equal(elements.get('res-m').value, '1');
    assert.equal(elements.get('res-cm').value, '0');
    assert.equal(elements.get('btn-next').style.display, 'inline-block');
});

test('acepta un número personalizado válido y ofrece las posiciones disponibles', () => {
    const { game, elements } = createGame();
    const input = elements.get('custom-input-number');
    const select = elements.get('custom-target-select');
    input.value = '999999';
    input.dispatch('input');

    assert.equal(select.disabled, false);
    assert.ok(select.options.some(option => option.value === 100000));

    select.value = '100000';
    elements.get('btn-custom-start').dispatch('click');
    assert.equal(game.state.currentNumber, 999999);
    assert.equal(game.state.currentTargetValue, 100000);
    assert.equal(elements.get('custom-modal').style.display, 'none');
});

test('rechaza decimales y números fuera del máximo personalizado', () => {
    const { game, elements, alerts } = createGame();
    const input = elements.get('custom-input-number');
    const select = elements.get('custom-target-select');

    for (const value of ['10.5', '1000000']) {
        input.value = value;
        input.dispatch('input');
        assert.equal(select.disabled, true);
        elements.get('btn-custom-start').dispatch('click');
        assert.match(alerts.at(-1), /entero entre 10 y 999 999/);
    }
    assert.equal(game.state.currentNumber, 11);
});

test('la racha de tres aciertos abre el modal y avanzar desbloquea el nivel siguiente', () => {
    const { game, elements } = createGame();
    game.state.streak = 2;
    setQuestion(game, 248, 10);
    enterDigits(elements, 'src', 248);
    enterDigits(elements, 'res', 250);
    game.checkAnswer();

    assert.equal(elements.get('level-modal').style.display, 'flex');
    elements.get('btn-level-continue').dispatch('click');
    assert.equal(game.state.level, 2);
    assert.equal(game.state.streak, 0);
});

test('exige elegir el modo antes de mostrar el tablero y conserva nombre y modo en la sesión', () => {
    const { game, elements, modes, body } = createGame({ autoStart: false });
    game.startGame();
    assert.equal(elements.get('game-board').hidden, true);
    assert.match(elements.get('feedback-area').innerHTML, /Elige primero/);
    elements.get('player-name').value = '<Ana>';
    modes[1].checked = true;
    game.startGame();
    assert.equal(game.state.mode, 'decimal');
    assert.equal(game.state.playerName, '<Ana>');
    assert.equal(elements.get('game-board').hidden, false);
    assert.equal(body.classList['decimal-mode'], true);
    assert.match(elements.get('feedback-area').innerHTML, /&lt;Ana&gt;/);
});

test('analiza coma decimal, límites y hasta tres cifras sin usar coma flotante', () => {
    const { game } = createGame();
    assert.equal(game.parseDecimal('12,345'), 12345);
    assert.equal(game.parseDecimal('9 999,999'), 9999999);
    assert.equal(game.parseDecimal('0'), 0);
    for (const invalid of ['12.3', '12,1234', '-1', '10000', '']) assert.equal(game.parseDecimal(invalid), null);
});

test('redondea decimales en cada posición, incluidos empates y acarreos', () => {
    const { game } = createGame();
    game.state.mode = 'decimal';
    const cases = [
        [1499999, 1000000, 1000000], [1500000, 1000000, 2000000],
        [125000, 100000, 100000], [150000, 100000, 200000],
        [14999, 10000, 10000], [15000, 10000, 20000],
        [1499, 1000, 1000], [1500, 1000, 2000],
        [1234, 100, 1200], [1250, 100, 1300],
        [1235, 10, 1240], [1235, 1, 1235], [9999999, 1000000, 10000000]
    ];
    for (const [number, place, expected] of cases) {
        game.state.currentNumber = number;
        game.state.currentTargetValue = place;
        assert.equal(game.calculateCorrectAnswer(), expected, `${number} a ${place}`);
    }
    assert.equal(game.formatNumber(10000000), '10 000');
    assert.equal(game.formatNumber(12050), '12,05');
});

test('lee las posiciones decimales y valida el redondeo a milésimas sin cambiar el valor', () => {
    const { game, elements } = createGame();
    game.state.mode = 'decimal';
    game.state.currentNumber = 12345;
    game.state.currentTargetValue = 1;
    const digits = '0000012345';
    game.digitIds.forEach((id, index) => { elements.get(`src-${id}`).value = digits[index]; });
    const original = game.readNumberFromRow('src');
    assert.equal(original.val, 12345);
    assert.equal(game.calculateCorrectAnswer(), 12345);
    game.showHint();
    assert.match(elements.get('feedback-area').innerHTML, /se mantiene/);
});

test('acepta una misión decimal y ofrece posiciones decimales válidas', () => {
    const { game, elements } = createGame();
    game.state.mode = 'decimal';
    const input = elements.get('custom-input-number'), select = elements.get('custom-target-select');
    input.value = '9 999,999'; input.dispatch('input');
    assert.equal(select.disabled, false);
    assert.ok(select.options.some(option => option.value === 1));
    select.value = '1000000';
    elements.get('btn-custom-start').dispatch('click');
    assert.equal(game.state.currentNumber, 9999999);
    assert.equal(game.state.currentTargetValue, 1000000);
    assert.equal(elements.get('question-number-display').textContent, '9 999,999');
    input.value = '0,5'; input.dispatch('input');
    assert.ok(select.options.some(option => option.value === 1000), '0,5 también se puede redondear a unidades');
});

test('el progreso guardado es común al modo decimal y los mensajes sin nombre son neutrales', () => {
    const { game, elements, localStore } = createGame({ savedProgress: { level: 3, score: 12 } });
    game.state.mode = 'decimal';
    game.state.currentNumber = 12345;
    game.state.currentTargetValue = 10;
    game.state.currentTarget = 'centésimas';
    const digits = '0000012345';
    game.digitIds.forEach((id, index) => {
        elements.get(`src-${id}`).value = digits[index];
        elements.get(`res-${id}`).value = '0';
    });
    // 12,345 redondeado a centésimas es 12,35 (unidades enteras de milésima: 12350).
    const resultDigits = '0000012350';
    game.digitIds.forEach((id, index) => { elements.get(`res-${id}`).value = resultDigits[index]; });
    game.checkAnswer();
    assert.equal(game.state.score, 13);
    assert.deepEqual(JSON.parse(localStore.get('jurassicRoundGame_v5')), { level: 3, score: 13 });
    assert.match(elements.get('feedback-area').innerHTML, /¡Excelente!/);
    assert.doesNotMatch(elements.get('feedback-area').innerHTML, /undefined|,\s*!/);
});

test('los errores explican qué corregir y animan con nombre seguro o de forma neutral', () => {
    const { game, elements } = createGame();
    game.state.playerName = '<Luz>';
    setQuestion(game, 248, 10);
    enterDigits(elements, 'src', 248); enterDigits(elements, 'res', 240);
    game.checkAnswer();
    const feedback = elements.get('feedback-area').innerHTML;
    assert.match(feedback, /&lt;Luz&gt;/);
    assert.match(feedback, /redondeo correcto es 250/);
    assert.match(feedback, /Ánimo/);
    assert.equal(game.state.score, 0);
    assert.equal(game.state.streak, 0);
});
