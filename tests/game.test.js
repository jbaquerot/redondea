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
        this.innerHTML = '';
        this.style = {};
        this.disabled = false;
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

function createGame({ savedProgress = null, random = () => 0 } = {}) {
    const elements = new Map();
    for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) {
        if (!elements.has(id)) {
            const tag = html.match(new RegExp(`<([a-z]+)[^>]*\\bid="${id}"`))?.[1] || 'div';
            elements.set(id, new MockElement(id, tag));
        }
    }

    const textInputs = [...html.matchAll(/<input type="text" id="([^"]+)"/g)]
        .map(([, id]) => elements.get(id));
    const localStore = new Map();
    if (savedProgress !== null) {
        localStore.set('jurassicRoundGame_v5', JSON.stringify(savedProgress));
    }
    const alerts = [];
    const document = {
        getElementById(id) {
            const element = elements.get(id);
            if (!element) throw new Error(`Elemento no encontrado: ${id}`);
            return element;
        },
        querySelectorAll(selector) {
            if (selector === 'input[type="text"]') return textInputs;
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
        localStorage,
        Math: math,
        confirm: () => true,
        alert: message => alerts.push(message),
        console: { warn() {} }
    });
    vm.runInContext(source, context, { filename: 'app.js' });
    const game = vm.runInContext('Game', context);
    return { game, elements, localStore, alerts };
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
    assert.match(elements.get('feedback-area').innerHTML, /Paso 1 Incorrecto/);
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
