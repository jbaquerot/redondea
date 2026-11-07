const { after, afterEach, before, beforeEach, describe, test } = require('node:test');
const { once } = require('node:events');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const root = path.resolve(__dirname, '..');
const browserCandidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
].filter(Boolean);
const chromePath = browserCandidates.find(candidate => fs.existsSync(candidate));

class DevToolsClient {
    constructor(webSocketUrl) {
        this.socket = new WebSocket(webSocketUrl);
        this.nextId = 0;
        this.pending = new Map();
        this.ready = new Promise((resolve, reject) => {
            this.socket.addEventListener('open', resolve, { once: true });
            this.socket.addEventListener('error', reject, { once: true });
        });
        this.socket.addEventListener('message', event => {
            const message = JSON.parse(event.data);
            const pending = this.pending.get(message.id);
            if (!pending) return;
            this.pending.delete(message.id);
            if (message.error) pending.reject(new Error(message.error.message));
            else pending.resolve(message.result);
        });
    }

    async send(method, params = {}) {
        await this.ready;
        const id = ++this.nextId;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.socket.send(JSON.stringify({ id, method, params }));
            setTimeout(() => {
                if (this.pending.delete(id)) reject(new Error(`Timeout CDP: ${method}`));
            }, 10000).unref();
        });
    }

    async evaluate(expression) {
        const response = await this.send('Runtime.evaluate', {
            expression,
            awaitPromise: true,
            returnByValue: true
        });
        if (response.exceptionDetails) {
            throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
        }
        return response.result.value;
    }

    close() { this.socket.close(); }
}

async function getFreePort() {
    const server = net.createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    await new Promise(resolve => server.close(resolve));
    return port;
}

function serveProject() {
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    const server = http.createServer((request, response) => {
        const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
        const filename = pathname === '/' || pathname === '/redondea/' ? 'index.html' : path.basename(pathname);
        if (!['index.html', 'app.js', 'styles.css'].includes(filename)) {
            response.writeHead(404).end('Not found');
            return;
        }
        response.writeHead(200, { 'Content-Type': types[path.extname(filename)] });
        fs.createReadStream(path.join(root, filename)).pipe(response);
    });
    return server;
}

async function waitUntil(check, description, timeoutMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const result = await check();
            if (result) return result;
        } catch {}
        await delay(100);
    }
    throw new Error(`Tiempo de espera agotado: ${description}`);
}

function fillRow(prefix, number) {
    const places = ['m', 'cm', 'dm', 'um', 'c', 'd', 'u'];
    const digits = String(number).padStart(7, '0');
    return places.map((place, index) => {
        const id = `${prefix}-${place}`;
        return `(() => { const el = document.getElementById('${id}'); el.value = '${digits[index]}'; el.dispatchEvent(new Event('input', { bubbles: true })); })()`;
    }).join(';');
}

describe('Pruebas de navegador en Chrome headless', { concurrency: false }, () => {
    let server;
    let baseUrl;
    let chrome;
    let profileDir;
    let client;

    before(async () => {
        if (!chromePath) throw new Error('No se encontró Chrome/Chromium. Define CHROME_BIN para indicar la ruta.');
        server = serveProject();
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        baseUrl = `http://127.0.0.1:${server.address().port}/redondea/`;
        const debugPort = await getFreePort();
        profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'redondea-chrome-'));
        chrome = spawn(chromePath, [
            '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
            '--no-sandbox', '--remote-allow-origins=*', `--remote-debugging-port=${debugPort}`,
            `--user-data-dir=${profileDir}`, baseUrl
        ], { stdio: 'ignore' });

        const target = await waitUntil(async () => {
            const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
            const pages = await response.json();
            return pages.find(page => page.type === 'page' && page.url.startsWith(baseUrl));
        }, 'Chrome abra la página del juego');
        client = new DevToolsClient(target.webSocketDebuggerUrl);
        await client.ready;
        await waitUntil(() => client.evaluate('document.readyState === "complete" && !!document.getElementById("btn-check")'), 'la aplicación termine de cargar');
    });

    beforeEach(async () => {
        await client.evaluate('localStorage.clear(); location.reload(); true');
        await waitUntil(() => client.evaluate('document.readyState === "complete" && !!document.getElementById("btn-check")'), 'recarga limpia del juego');
        await client.evaluate(`(() => { document.querySelector('input[name="game-mode"][value="integer"]').checked = true; document.getElementById('btn-start').click(); })()`);
    });

    afterEach(async () => {
        await client.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
    });

    after(async () => {
        client?.close();
        if (chrome && chrome.exitCode === null) {
            const exited = once(chrome, 'exit');
            chrome.kill('SIGTERM');
            await Promise.race([exited, delay(5000)]);
        }
        if (server?.listening) await new Promise(resolve => server.close(resolve));
        if (profileDir) {
            for (let attempt = 0; attempt < 5; attempt++) {
                try { fs.rmSync(profileDir, { recursive: true, force: true }); break; }
                catch { await delay(200); }
            }
        }
    });

    test('renderiza título, recursos locales y tablero ampliado bajo /redondea/', async () => {
        const rendered = await client.evaluate(`(() => {
            const game = document.querySelector('.game-container');
            return {
                title: document.title,
                background: getComputedStyle(document.body).backgroundColor,
                panelVisible: game.getBoundingClientRect().width > 0,
                stylesheetLoaded: [...document.styleSheets].some(sheet => sheet.href?.endsWith('/styles.css')),
                scriptLoaded: [...document.scripts].some(script => script.src.endsWith('/app.js')),
                placeColumns: document.querySelectorAll('thead th').length,
                digitInputs: document.querySelectorAll('.digit-input-label').length,
                projectPath: location.pathname
            };
        })()`);
        assert.equal(rendered.title, 'Redondea los números: Edición Jurásica');
        assert.equal(rendered.background, 'rgb(18, 18, 18)');
        assert.equal(rendered.panelVisible, true);
        assert.equal(rendered.stylesheetLoaded, true);
        assert.equal(rendered.scriptLoaded, true);
        assert.equal(rendered.placeColumns, 11);
        assert.equal(rendered.digitInputs, 20);
        assert.equal(rendered.projectPath, '/redondea/');
    });

    test('adapta el tablero a móvil y permite desplazamiento horizontal', async () => {
        await client.send('Emulation.setDeviceMetricsOverride', {
            width: 390, height: 844, deviceScaleFactor: 1, mobile: false
        });
        const layout = await client.evaluate(`(() => {
            const wrapper = document.querySelector('.input-wrapper');
            const panel = document.querySelector('.game-container');
            return {
                viewport: innerWidth,
                panelWidth: panel.getBoundingClientRect().width,
                overflow: getComputedStyle(wrapper).overflowX,
                contentWiderThanWrapper: wrapper.scrollWidth > wrapper.clientWidth
            };
        })()`);
        assert.equal(layout.viewport, 390, JSON.stringify(layout));
        assert.ok(layout.panelWidth <= layout.viewport, JSON.stringify(layout));
        assert.equal(layout.overflow, 'auto');
        assert.equal(layout.contentWiderThanWrapper, true);
        await client.send('Emulation.clearDeviceMetricsOverride');
    });

    test('el teclado avanza al siguiente campo de cifra', async () => {
        await client.evaluate('document.getElementById("src-m").focus()');
        await client.send('Input.insertText', { text: '9' });
        const activeId = await client.evaluate('document.activeElement.id');
        assert.equal(activeId, 'src-cm');
        assert.equal(await client.evaluate('document.getElementById("src-m").value'), '9');
        const nextRow = await client.evaluate(`(() => {
            const lastInteger = document.getElementById('src-u');
            lastInteger.value = '4'; lastInteger.dispatchEvent(new Event('input', { bubbles: true }));
            return document.activeElement.id;
        })()`);
        assert.equal(nextRow, 'res-m');
    });

    test('un clic en Comprobar valida la respuesta y actualiza la puntuación', async () => {
        await client.evaluate(`(() => {
            Game.state.currentNumber = 248;
            Game.state.currentTargetValue = 10;
            Game.state.currentTarget = 'decenas';
            document.getElementById('question-number-display').textContent = '248';
            document.getElementById('question-target-display').textContent = 'decenas';
            ${fillRow('src', 248)};
            ${fillRow('res', 250)};
            document.getElementById('btn-check').click();
        })()`);
        const result = await client.evaluate(`({
            score: document.getElementById('score-display').textContent,
            feedback: document.getElementById('feedback-area').textContent,
            nextVisible: getComputedStyle(document.getElementById('btn-next')).display !== 'none'
        })`);
        assert.equal(result.score, 'Aciertos: 1');
        assert.match(result.feedback, /¡Excelente!/);
        assert.equal(result.nextVisible, true);
    });

    test('el modal personalizado permite elegir un número, una posición y empezar', async () => {
        await client.evaluate(`(() => {
            document.getElementById('btn-custom').click();
            const input = document.getElementById('custom-input-number');
            input.value = '999999';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            const select = document.getElementById('custom-target-select');
            select.value = '100000';
            document.getElementById('btn-custom-start').click();
        })()`);
        const result = await client.evaluate(`({
            number: document.getElementById('question-number-display').textContent,
            target: document.getElementById('question-target-display').textContent,
            modalDisplay: getComputedStyle(document.getElementById('custom-modal')).display
        })`);
        assert.equal(result.number, '999 999');
        assert.equal(result.target, 'centenas de millar');
        assert.equal(result.modalDisplay, 'none');
    });

    test('el botón de solución rellena el millón y habilita Siguiente', async () => {
        await client.evaluate(`(() => {
            Game.state.currentNumber = 999999;
            Game.state.currentTargetValue = 100000;
            Game.state.currentTarget = 'centenas de millar';
            document.getElementById('btn-hint').click();
            document.getElementById('btn-solve').click();
        })()`);
        const result = await client.evaluate(`({
            millionDigit: document.getElementById('res-m').value,
            hundredThousandsDigit: document.getElementById('res-cm').value,
            nextVisible: getComputedStyle(document.getElementById('btn-next')).display !== 'none'
        })`);
        assert.equal(result.millionDigit, '1');
        assert.equal(result.hundredThousandsDigit, '0');
        assert.equal(result.nextVisible, true);
    });

    test('bloquea el tablero hasta elegir modo e inicia decimales con nombre', async () => {
        await client.evaluate('location.reload()');
        await waitUntil(() => client.evaluate('document.readyState === "complete"'), 'recarga para comprobar el inicio');
        const initial = await client.evaluate(`({ hidden: document.getElementById('game-board').hidden, hasQuestion: !!document.getElementById('question-number-display').textContent })`);
        assert.equal(initial.hidden, true);
        await client.evaluate(`(() => {
            document.getElementById('player-name').value = '<Leo>';
            document.querySelector('input[name="game-mode"][value="decimal"]').checked = true;
            document.getElementById('btn-start').click();
        })()`);
        const started = await client.evaluate(`({
            hidden: document.getElementById('game-board').hidden,
            decimalMode: document.body.classList.contains('decimal-mode'),
            greeting: document.getElementById('feedback-area').innerHTML
        })`);
        assert.equal(started.hidden, false);
        assert.equal(started.decimalMode, true);
        assert.match(started.greeting, /&lt;Leo&gt;/);
        const decimalFocus = await client.evaluate(`(() => {
            const units = document.getElementById('src-u');
            units.value = '2'; units.dispatchEvent(new Event('input', { bubbles: true }));
            return document.activeElement.id;
        })()`);
        assert.equal(decimalFocus, 'src-tenths');
        await client.evaluate(`(() => {
            document.getElementById('btn-custom').click();
            const input = document.getElementById('custom-input-number');
            input.value = '9 999,999'; input.dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('custom-target-select').value = '1000000';
            document.getElementById('btn-custom-start').click();
        })()`);
        const mission = await client.evaluate(`({ number: document.getElementById('question-number-display').textContent, target: document.getElementById('question-target-display').textContent })`);
        assert.deepEqual(mission, { number: '9 999,999', target: 'millares' });
    });

    test('las columnas decimales visibles se pueden alcanzar en móvil', async () => {
        await client.evaluate(`document.body.classList.add('decimal-mode')`);
        await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
        const layout = await client.evaluate(`(() => {
            const wrapper = document.querySelector('.input-wrapper');
            const lastColumn = document.querySelector('#src-thousandths').parentElement;
            return {
                visible: getComputedStyle(lastColumn).display !== 'none',
                scrollable: wrapper.scrollWidth > wrapper.clientWidth,
                inputReachable: lastColumn.getBoundingClientRect().right > wrapper.getBoundingClientRect().left
            };
        })()`);
        assert.deepEqual(layout, { visible: true, scrollable: true, inputReachable: true });
        await client.send('Emulation.clearDeviceMetricsOverride');
    });
});
