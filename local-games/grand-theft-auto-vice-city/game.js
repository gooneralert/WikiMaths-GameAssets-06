const cloudSavesStatus = document.getElementById('cloud-saves-status');
var statusElement = document.getElementById("status");
var progressElement = document.getElementById("progress");
var spinnerElement = document.getElementById('spinner');
var data_content;
var wasm_content;

const params = new URLSearchParams(window.location.search);

// Base URLs
const replaceFetch = (str) => str.replace("https://cdn.dos.zone/vcsky/", "vcsky/")
const replaceBR = "vcbr/"

// Configurable mode - show settings UI before play
const configurableMode = params.get('configurable') === "1";

// Settings that can be configured via URL or UI
let autoFullScreen = params.get('fullscreen') === "1";
let cheatsEnabled = params.get('cheats') === "1" || configurableMode;
let maxFPS = parseInt(params.get('max_fps')) || 0;

// full game access
if (params.get('request_original_game') !== "1") {
    try { localStorage.setItem('vcsky.haveOriginalGame', 'true'); } catch (e) {}
}

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let isTouch = isMobile && window.matchMedia('(pointer: coarse)').matches;

document.body.dataset.isTouch = isTouch ? 1 : 0;

const dataSize = 130 * 1024 * 1024;
const textDecoder = new TextDecoder();
let haveOriginalGame = true;
const translations = {
    en: {
        clickToPlayDemo: "Click to play demo",
        clickToPlayFull: "Click to play",
        invalidKey: "invalid key",
        checking: "checking...",
        cloudSaves: "Cloud saves:",
        enabled: "enabled",
        disabled: "disabled",
        playDemoText: "You can play the DEMO version, or provide the original game files to play the full version.",
        disclaimer: "DISCLAIMER:",
        disclaimerSources: "This game is based on an open source version of GTA: Vice City. It is not a commercial release and is not affiliated with Rockstar Games.",
        disclaimerCheckbox: "I own the original game",
        disclaimerPrompt: "You need to provide a file from the original game to confirm ownership of the original game.",
        cantContinuePlaying: "You can't continue playing in DEMO version. Please provide the original game files to continue playing.",
        demoAlert: "The demo version is intended only for familiarizing yourself with the game technology. All features are available, but you won't be able to progress through the game's storyline. Please provide the original game files to launch the full version.",
        downloading: "Downloading",
        enterKey: "enter your key",
        clickToContinue: "Click to continue...",
        enterJsDosKey: "Enter js-dos key (5 len)",
        portBy: "HTML5 port by:",
        ruTranslate: "",
        demoOffDisclaimer: "Due to the unexpectedly high popularity of the project, resulting in significant traffic costs, and in order to avoid any risk of the project being shut down due to rights holder claims, we have disabled the demo version. You can still run the full version by providing the original game resources.",
        configLanguage: "Language:",
        configCheats: "Cheats (F3)",
        configFullscreen: "Fullscreen",
        configMaxFps: "Max FPS:",
        configUnlimited: "(0 = unlimited)",
    },
    ru: {
        clickToPlayDemo: "Играть в демо версию",
        clickToPlayFull: "Играть",
        invalidKey: "неверный ключ",
        checking: "проверка...",
        cloudSaves: "Облачные сохранения:",
        enabled: "включены",
        disabled: "выключены",
        playDemoText: "Вы можете играть в демо версию, или предоставить оригинальные файлы игры для полной версии.",
        disclaimer: "ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ:",
        disclaimerSources: "Эта игра основана на открытой версии GTA: Vice City. Она не является коммерческим изданием и не связана с Rockstar Games.",
        disclaimerCheckbox: "Я владею оригинальной игрой",
        disclaimerPrompt: "Вам потребуется приложить какой-либо файл из оригинальной игры для подтверждения владения оригинальной игрой.",
        cantContinuePlaying: "Вы не можете продолжить игру в демо версии. Пожалуйста, предоставьте оригинальные файлы игры для продолжения игры.",
        demoAlert: "Демо версия предназначена только для ознакомления с технологией игры. Все функции доступны, но вы не сможете продолжить игру по сюжету. Пожалуйста, предоставьте оригинальные файлы игры для запуска полной версии.",
        downloading: "Загрузка",
        enterKey: "введите ваш ключ",
        clickToContinue: "Нажмите для продолжения...",
        enterJsDosKey: "Введите ключ js-dos (5 букв)",
        portBy: "Авторы HTML5 порта:",
        ruTranslate: `
<div class="translated-by">
    <span>Переведено на русский студией</span>
    <a href="https://www.gamesvoice.ru/" target="_blank">GamesVoice</a>
</div>
`,
        demoOffDisclaimer: "В связи с неожиданно высокой популярностью проекта, как следствие — значительными расходами на трафик, а также во избежание рисков закрытия проекта из-за претензий правообладателей, мы отключили возможность запуска демо-версии. При этом вы по-прежнему можете запустить полную версию, предоставив оригинальные ресурсы.",
        configLanguage: "Язык:",
        configCheats: "Читы (F3)",
        configFullscreen: "Полный экран",
        configMaxFps: "Макс. FPS:",
        configUnlimited: "(0 = без ограничений)",
    },
};

var currentLanguage = navigator.language.split("-")[0] === "ru" ? "ru" : "en";
if (params.get("lang") === "ru") {
    currentLanguage = "ru";
} else if (params.get("lang") === "en") {
    currentLanguage = "en";
}

function t(key) {
    return (translations[currentLanguage] && translations[currentLanguage][key]) || key || "";
}
window.t = t;

// Function to update all translated texts on the page
function updateAllTranslations() {
    const keyInput = document.querySelector('.jsdos-key-input');
    if (keyInput) keyInput.setAttribute('placeholder', t("enterJsDosKey"));
    
    const clickToPlayButton = document.getElementById('click-to-play-button');
    if (clickToPlayButton) {
        clickToPlayButton.textContent = haveOriginalGame ? t('clickToPlayFull') : t('clickToPlayDemo');
    }
    
    const demoOffDisclaimer = document.getElementById('demo-off-disclaimer');
    if (demoOffDisclaimer) {
        demoOffDisclaimer.textContent = haveOriginalGame ? "" : "* " + t('demoOffDisclaimer');
    }
    
    const cloudSavesLink = document.getElementById('cloud-saves-link');
    if (cloudSavesLink) cloudSavesLink.textContent = t('cloudSaves');
    
    const cloudSavesStatus = document.getElementById('cloud-saves-status');
    if (cloudSavesStatus) cloudSavesStatus.textContent = t('enterKey');
    
    const playDemoText = document.getElementById('play-demo-text');
    if (playDemoText) playDemoText.textContent = t('playDemoText');
    
    const disclaimerText = document.getElementById('disclaimer-text');
    if (disclaimerText) disclaimerText.textContent = t('disclaimer');
    
    const disclaimerSources = document.getElementById('disclaimer-sources');
    if (disclaimerSources) disclaimerSources.textContent = t('disclaimerSources');
    
    const disclaimerCheckboxLabel = document.getElementById('disclaimer-checkbox-label');
    if (disclaimerCheckboxLabel) disclaimerCheckboxLabel.textContent = t('disclaimerCheckbox');
    
    const portBy = document.getElementById('port-by');
    if (portBy) portBy.textContent = t('portBy');
    
    // Update developed-by section for ruTranslate
    const developedBy = document.querySelector('.developed-by');
    const existingTranslatedBy = developedBy?.querySelector('.translated-by');
    if (existingTranslatedBy) existingTranslatedBy.remove();
    if (developedBy && t('ruTranslate')) {
        developedBy.insertAdjacentHTML('beforeend', t('ruTranslate'));
    }
    
    // Update config panel labels if present
    const configLangLabel = document.getElementById('config-lang-label');
    if (configLangLabel) configLangLabel.textContent = t('configLanguage');
    
    const configCheatsLabel = document.getElementById('config-cheats-label');
    if (configCheatsLabel) configCheatsLabel.textContent = t('configCheats');
    
    const configFullscreenLabel = document.getElementById('config-fullscreen-label');
    if (configFullscreenLabel) configFullscreenLabel.textContent = t('configFullscreen');
    
    const configMaxFpsLabel = document.getElementById('config-max-fps-label');
    if (configMaxFpsLabel) configMaxFpsLabel.textContent = t('configMaxFps');
    
    const configMaxFpsUnlimited = document.getElementById('config-max-fps-unlimited');
    if (configMaxFpsUnlimited) configMaxFpsUnlimited.textContent = t('configUnlimited');
}

// Function to update game data files based on language
function updateGameDataForLanguage(lang) {
    if (lang === 'ru') {
        data_content = `${replaceBR}vc-sky-ru-v6.data`;
        wasm_content = `${replaceBR}vc-sky-ru-v6.wasm`;
    } else {
        data_content = `${replaceBR}vc-sky-en-v6.data`;
        wasm_content = `${replaceBR}vc-sky-en-v6.wasm`;
    }
}

// Initialize data files based on current language
updateGameDataForLanguage(currentLanguage);

async function loadData() {
    let cache;
    try {
        cache = await caches.open(location.hostname);
        const cached = await cache.match(data_content);
        if (cached && data_content !== "index.data") {
            return new Uint8Array(await cached.arrayBuffer());
        }
    } catch (e) {
        console.error('Failed to open cache:', e);
    }
    let response;
    try {
        response = await fetch(data_content);
        if (!response.ok && data_content.endsWith('.data')) {
            response = await fetch(data_content + '.br');
        }
    } catch (e) {
        if (data_content.endsWith('.data')) {
            response = await fetch(data_content + '.br');
        } else {
            throw e;
        }
    }

    const reader = response.body.getReader();
    let receivedLength = 0;
    let chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        receivedLength += value.length;
        if (typeof setStatus === "function") {
            setStatus(`Downloading...(${receivedLength}/${dataSize})`);
        }
    }
    let buffer = new Uint8Array(receivedLength);
    let position = 0;
    for (let chunk of chunks) {
        buffer.set(chunk, position);
        position += chunk.length;
    }
    buffer = buffer.buffer;
    if (cache) {
        try {
            await cache.put(data_content, new Response(buffer, { headers: { 'Content-Type': 'application/octet-stream' } }));
        } catch (e) {
            console.error('Failed to cache data:', e.message);
        }
    }
    return new Uint8Array(buffer);
};

let gameHasStarted = false;

async function startGame(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (gameHasStarted) return;

    const startContainer = document.querySelector('.start-container');
    if (startContainer) startContainer.style.display = 'none';
    const disclaimer = document.querySelector('.disclaimer');
    if (disclaimer) disclaimer.style.display = 'none';
    const developedBy = document.querySelector('.developed-by');
    if (developedBy) developedBy.style.display = 'none';

    const intro = document.getElementById('intro-video') || document.querySelector('.intro');
    const introContainer = document.getElementById('intro-container') || document.querySelector('.intro-container');
    const introHint = document.getElementById('intro-hint');
    const loaderContainer = document.getElementById('loader-container') || document.querySelector('.loader-container');

    // Start fetching game data package in the background immediately
    const dataPromise = loadData();

    if (!intro || !introContainer) {
        gameHasStarted = true;
        const dataBuffer = await dataPromise;
        if (loaderContainer) loaderContainer.style.display = 'none';
        loadGame(dataBuffer);
        return;
    }

    introContainer.style.display = 'flex';
    introContainer.hidden = false;
    if (loaderContainer) loaderContainer.style.display = 'none';

    let isTransitioning = false;
    let playPromise = null;

    const transitionToGame = async () => {
        if (isTransitioning || gameHasStarted) return;
        isTransitioning = true;
        gameHasStarted = true;

        // Clean up intro event listeners
        window.removeEventListener('keydown', handleKey, true);
        window.removeEventListener('pointerdown', handleClick, true);
        intro.removeEventListener('ended', transitionToGame);

        // Safely pause intro video
        if (playPromise) {
            try { await playPromise; } catch (err) {}
        }
        try { intro.pause(); } catch (err) {}

        if (introContainer) introContainer.style.display = 'none';

        // Wait for data package if not loaded yet
        let dataBuffer;
        try {
            dataBuffer = await dataPromise;
        } catch (err) {
            console.error('Failed to load game data:', err);
            if (loaderContainer) loaderContainer.style.display = 'flex';
            setStatus(`Failed to load data: ${err.message}`);
            return;
        }

        if (loaderContainer) loaderContainer.style.display = 'none';
        loadGame(dataBuffer);
    };

    const handleKey = (evt) => {
        // Space, Enter, Escape, or any key skips immediately
        if (evt.code === 'Space' || evt.code === 'Enter' || evt.code === 'Escape' || evt.key === ' ' || evt.key === 'Enter' || evt.key === 'Escape') {
            evt.preventDefault();
            evt.stopPropagation();
            transitionToGame();
        } else if (intro.muted) {
            intro.muted = false;
            if (introHint) {
                introHint.textContent = 'Space / Enter to skip';
                setTimeout(() => { if (introHint) introHint.style.opacity = '0'; }, 3000);
            }
        } else {
            transitionToGame();
        }
    };

    const handleClick = (evt) => {
        if (intro.muted) {
            // First click unmutes if browser blocked sound autoplay
            intro.muted = false;
            if (introHint) {
                introHint.textContent = 'Space / Enter or click to skip';
                setTimeout(() => { if (introHint) introHint.style.opacity = '0'; }, 3000);
            }
        } else {
            // Already unmuted: clicking skips the intro
            transitionToGame();
        }
    };

    window.addEventListener('keydown', handleKey, true);
    window.addEventListener('pointerdown', handleClick, true);
    intro.addEventListener('ended', transitionToGame);

    // Play intro video
    try {
        intro.currentTime = 0;
        playPromise = intro.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (introHint) {
                    introHint.textContent = 'Space / Enter to skip';
                    setTimeout(() => { if (introHint) introHint.style.opacity = '0'; }, 3500);
                }
            }).catch((err) => {
                console.log('Unmuted autoplay prevented by browser policy, falling back to muted:', err.message);
                intro.muted = true;
                playPromise = intro.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (introHint) {
                            introHint.textContent = 'Click to unmute \u2022 Space to skip';
                        }
                    }).catch((err2) => {
                        console.log('Muted autoplay also prevented:', err2.message);
                        if (introHint) {
                            introHint.textContent = 'Click anywhere to start';
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.error('Error starting intro video:', e);
    }
}

function setStatus(text) {
    if (!text) {
        if (progressElement) progressElement.hidden = true;
        if (spinnerElement) spinnerElement.hidden = true;
        return;
    }
    const match = text.match(/(.+)\((\d+\.?\d*)\/(\d+)\)/);
    if (match) {
        const [current, total] = match.slice(2, 4).map(Number);
        const percent = Math.min(100, Math.round(current / total * 100));
        if (statusElement) statusElement.textContent = `Loading... ${percent}%`;
        if (progressElement) {
            progressElement.value = current;
            progressElement.max = total;
            progressElement.hidden = false;
        }
        if (spinnerElement) {
            spinnerElement.hidden = false;
            const progressBarFill = spinnerElement.querySelector('.progress-bar-fill');
            if (progressBarFill) {
                progressBarFill.style.width = percent + '%';
            }
        }
    } else {
        if (statusElement) statusElement.textContent = text;
    }
};

// Helpers for Local Browser Saves
function uint8ToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const btoaFn = typeof btoa !== 'undefined' ? btoa : (typeof window !== 'undefined' ? window.btoa : null);
    return btoaFn(binary);
}

function base64ToUint8(base64) {
    const atobFn = typeof atob !== 'undefined' ? atob : (typeof window !== 'undefined' ? window.atob : null);
    const binary = atobFn(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// Clean out any previously injected 100% preset saves from browser storage
try {
    const localSaved = localStorage.getItem('vcsky.local_saves');
    if (localSaved && !localStorage.getItem('vcsky.clean_saves_user_v1')) {
        const bytes = base64ToUint8(localSaved);
        if (window.idbfsCodec && window.idbfsCodec.decodeEntries) {
            try {
                const entries = window.idbfsCodec.decodeEntries(bytes);
                const hasPreset = entries.some(e => {
                    const s = String.fromCharCode(...e.contents.slice(4, 50));
                    return s.includes('Keep your Friends') || s.includes('Demolition Man') || s.includes('Distribution');
                });
                if (hasPreset) {
                    localStorage.removeItem('vcsky.local_saves');
                    console.log('[Saves] Cleared previously injected 100% preset saves from localStorage.');
                }
            } catch (err) {}
        }
        localStorage.setItem('vcsky.clean_saves_user_v1', '1');
    }
} catch (e) {}

async function loadGame(data) {
    var Module = {
        mainCalled: () => {
            try {
                Module.FS.unlink("/vc-assets/local/revc.ini");
                Module.FS.createDataFile("/vc-assets/local/revc.ini", 0, revc_ini, revc_ini.length);
            } catch (e) {
                console.error('mainCalled error:', e);
            }
        },
        syncRevcIni: () => {
            try {
                const path = Module.FS.lookupPath("/vc-assets/local/revc.ini");
                if (path && path.node && path.node.contents) {
                    localStorage.setItem('vcsky.revc.ini', textDecoder.decode(path.node.contents));
                }
            } catch (e) {
                console.error('syncRevcIni error:', e);
            }
        },
        preRun: [],
        postRun: [],
        print: (...args) => console.log(args.join(' ')),
        printErr: (...args) => console.error(args.join(' ')),
        getPreloadedPackage: () => {
            return data.buffer;
        },
        canvas: function () {
            const canvas = document.getElementById('canvas');
            canvas.addEventListener('webglcontextlost', (e) => {
                statusElement.textContent = 'WebGL context lost. Please reload the page.';
                e.preventDefault();
            });
            return canvas;
        }(),
        setStatus,
        totalDependencies: 0,
        monitorRunDependencies: (num) => {
            Module.totalDependencies = Math.max(Module.totalDependencies, num);
            Module.setStatus(`Preparing... (${Module.totalDependencies - num}/${Module.totalDependencies})`);
        },
        hotelMission: () => {
            // Full version: continue storyline
        },
        onExit: (code) => {
            console.log('GTA Vice City exited with code:', code);
            window.onbeforeunload = null;
            location.reload();
        },
    };
    Module.log = Module.print;
    Module.instantiateWasm = async (
        info,
        receiveInstance,
    ) => {
        let wasmRes;
        try {
            wasmRes = await fetch(wasm_content ? wasm_content : "index.wasm");
            if (!wasmRes.ok && wasm_content && wasm_content.endsWith('.wasm')) {
                wasmRes = await fetch(wasm_content + '.br');
            }
        } catch (e) {
            if (wasm_content && wasm_content.endsWith('.wasm')) {
                wasmRes = await fetch(wasm_content + '.br');
            } else {
                throw e;
            }
        }
        const wasm = await wasmRes.arrayBuffer();
        const module = await WebAssembly.instantiate(wasm, info);
        return receiveInstance(module.instance, module);
    };
    window.onerror = (message) => {
        Module.setStatus(`Error: ${message}`);
        spinnerElement.hidden = true;
    };
    Module.arguments = window.location.search
        .slice(1)
        .split('&')
        .filter(Boolean)
        .map(decodeURIComponent);
    window.onbeforeunload = function (event) {
        event.preventDefault();
        return '';
    };

    Module.onExit = function (status) {
        console.log('[Module] Game exited with code:', status);
        window.onbeforeunload = null;
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        location.reload();
    };

    window.Module = Module;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'index.js';
    document.body.appendChild(script);

    document.body.classList.add('gameIsStarted');

    const emulator = new GamepadEmulator();
    const gamepad = emulator.AddEmulatedGamepad(null, true);
    const gamepadEmulatorConfig = {
        directions: { up: true, down: true, left: true, right: true },
        dragDistance: 100,
        tapTarget: move,
        lockTargetWhilePressed: true,
        xAxisIndex: 0,
        yAxisIndex: 1,
        swapAxes: false,
        invertX: false,
        invertY: false,
    };
    emulator.AddDisplayJoystickEventListeners(0, [gamepadEmulatorConfig]);
    const gamepadEmulatorConfig1 = {
        directions: { up: true, down: true, left: true, right: true },
        dragDistance: 100,
        tapTarget: look,
        lockTargetWhilePressed: true,
        xAxisIndex: 2,
        yAxisIndex: 3,
        swapAxes: false,
        invertX: false,
        invertY: false,
    };
    emulator.AddDisplayJoystickEventListeners(0, [gamepadEmulatorConfig1]);

    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 9,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.menu'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 3,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.car.getIn'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 0,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.run'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 1,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fist'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 5,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.drift'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 2,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.jump'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 4,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.mobile'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 11,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.job'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 4,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.radio'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 7,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.weapon'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 8,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.camera'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 10,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.horn'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 7,
        buttonIndexes: [1, 7],
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fireRight'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 6,
        buttonIndexes: [1, 6],
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fireLeft'),
    }]);
}

const clickToPlay = document.querySelector('.click-to-play');
if (clickToPlay) {
    const clickLink = clickToPlay.querySelector('button');
    clickToPlay.addEventListener('click', (e) => {
        if (!haveOriginalGame) {
            alert(t('demoOffDisclaimer'));
            return;
        }
        if (e.target === clickToPlay || e.target === clickLink) {
            startGame(e);
        }
    });
}

if (!isMobile) {
    function lockMouseIfNeeded(e) {
        // If in menu, allow free cursor movement to click menu buttons
        if (document.body.dataset.stateMenu === "1") return;
        if (typeof Module !== 'undefined' && Module.canvas && e.target === Module.canvas) {
            if (!document.pointerLockElement) {
                try {
                    const p = Module.canvas.requestPointerLock({
                        unadjustedMovement: true,
                    });
                    if (p && p.catch) p.catch(() => {});
                } catch (err) {}
            }
        }
    }
    document.addEventListener("mousedown", lockMouseIfNeeded);
}

// Global audio unlock on first user interaction
const unlockAudio = () => {
    if (typeof SDL2 !== 'undefined' && SDL2.audioContext && SDL2.audioContext.state === 'suspended') {
        SDL2.audioContext.resume().catch(() => {});
    }
};
window.addEventListener('click', unlockAudio);
window.addEventListener('keydown', unlockAudio);
window.addEventListener('touchstart', unlockAudio);

// Trigger in-game menu (Escape key + Gamepad Menu)
function triggerGameMenu() {
    const downEvt = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true });
    const upEvt = new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true });
    window.dispatchEvent(downEvt);
    document.dispatchEvent(downEvt);
    if (typeof Module !== 'undefined' && Module.canvas) {
        Module.canvas.dispatchEvent(downEvt);
    }
    setTimeout(() => {
        window.dispatchEvent(upEvt);
        document.dispatchEvent(upEvt);
        if (typeof Module !== 'undefined' && Module.canvas) {
            Module.canvas.dispatchEvent(upEvt);
        }
    }, 40);

    try {
        const menuBtn = document.querySelector('.touch-control.menu');
        if (menuBtn) {
            menuBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            setTimeout(() => {
                menuBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
            }, 40);
        }
    } catch (e) {}
}

// Keyboard shortcuts for in-game menu: P
window.addEventListener('keydown', (e) => {
    if (!document.body.classList.contains('gameIsStarted')) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP') {
        e.preventDefault();
        triggerGameMenu();
    }
});

// Save Export / Import Handlers
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-export-save')?.addEventListener('click', () => {
        const localSaved = localStorage.getItem('vcsky.local_saves');
        if (!localSaved) {
            alert('No local browser saves found yet! Launch the game and save at any safehouse first.');
            return;
        }
        try {
            const bytes = base64ToUint8(localSaved);
            const blob = new Blob([bytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `gtavc_save_${dateStr}.saves`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export save error:', err);
            alert('Failed to export save: ' + err.message);
        }
    });

    document.getElementById('btn-import-save')?.addEventListener('click', () => {
        document.getElementById('import-save-file')?.click();
    });

    document.getElementById('import-save-file')?.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            if (bytes.length === 0) {
                alert('Selected file is empty.');
                return;
            }

            // Check if file is already a packaged .saves archive or a raw .b save file
            let finalBytes = bytes;
            const isDotB = file.name.toLowerCase().endsWith('.b') || file.name.toLowerCase().startsWith('gtavcsf');
            
            if (isDotB && window.idbfsCodec && window.idbfsCodec.encodeEntries) {
                let targetSlotName = file.name;
                if (!targetSlotName.toLowerCase().startsWith('gtavcsf')) {
                    targetSlotName = 'GTAVCsf1.b';
                }
                const entry = {
                    path: savesMountPoint + '/' + targetSlotName,
                    timestamp: new Date(),
                    mode: 33206,
                    contents: bytes
                };

                let entries = [entry];
                const existing = localStorage.getItem('vcsky.local_saves');
                if (existing && window.idbfsCodec.decodeEntries) {
                    try {
                        const existingEntries = window.idbfsCodec.decodeEntries(base64ToUint8(existing));
                        entries = existingEntries.filter(ent => !ent.path.endsWith(targetSlotName));
                        entries.push(entry);
                    } catch (decErr) {
                        console.warn('Could not merge existing entries:', decErr);
                    }
                }
                finalBytes = window.idbfsCodec.encodeEntries(entries);
            }

            const base64 = uint8ToBase64(finalBytes);
            localStorage.setItem('vcsky.local_saves', base64);
            alert(`Save "${file.name}" imported successfully (${(bytes.length / 1024).toFixed(1)} KB)! Click "Click to play" to load it.`);
        } catch (err) {
            console.error('Import save error:', err);
            alert('Failed to import save: ' + err.message);
        } finally {
            e.target.value = '';
        }
    });

    document.getElementById('btn-clear-saves')?.addEventListener('click', () => {
        if (!confirm('Are you sure you want to delete all saved games in this browser?')) {
            return;
        }
        try {
            localStorage.removeItem('vcsky.local_saves');
            alert('All local saves have been cleared.');
        } catch (e) {
            console.error('Clear saves error:', e);
        }
    });
});

const savesMountPoint = "/vc-assets/local/userfiles";
const savesFile = "vcsky.saves";
(window.wrapIDBFS || globalThis.wrapIDBFS || wrapIDBFS)(console.log).addListener({
    onLoad: async (_, mount) => {
        const isSaves = mount.mountpoint === savesMountPoint || 
                        mount.mountpoint === savesMountPoint.replace(/^\//, '') ||
                        mount.mountpoint.endsWith('userfiles');
        if (!isSaves) {
            return null;
        }

        // 1. Check CloudSDK if a 5-letter key is provided
        const token = localStorage.getItem('vcsky.key');
        if (token && token.length === 5) {
            try {
                const payload = await CloudSDK.pullFromStorage(token, savesFile);
                if (payload && payload.length > 0) {
                    console.log('[IDBFS] Loaded from CloudSDK', token, (payload.length / 1024).toFixed(1), 'kb');
                    return payload;
                }
            } catch (e) {
                console.warn('[CloudSDK] pull error:', e);
            }
        }

        // 2. Restore from browser local storage (offline local saves)
        try {
            const localSaved = localStorage.getItem('vcsky.local_saves');
            if (localSaved) {
                const bytes = base64ToUint8(localSaved);
                if (bytes.length > 0) {
                    console.log('[LocalSaves] Successfully restored local browser save:', (bytes.length / 1024).toFixed(1), 'kb');
                    return bytes;
                }
            }
        } catch (e) {
            console.warn('[LocalSaves] localStorage load error:', e);
        }

        // No local saves found - return empty buffer to ensure IDBFS starts fresh/empty
        return new Uint8Array(0);
    },
    onSave: (getData, _, mount) => {
        const isSaves = mount.mountpoint === savesMountPoint || 
                        mount.mountpoint === savesMountPoint.replace(/^\//, '') ||
                        mount.mountpoint.endsWith('userfiles');
        if (!isSaves) {
            return;
        }
        getData().then((payload) => {
            if (!payload || payload.length === 0) return;

            // 1. Always save to browser localStorage
            try {
                const base64 = uint8ToBase64(payload);
                localStorage.setItem('vcsky.local_saves', base64);
                console.log('[LocalSaves] Successfully saved to browser localStorage:', (payload.length / 1024).toFixed(1), 'kb');
            } catch (e) {
                console.warn('[LocalSaves] Failed to save to localStorage:', e);
            }

            // 2. Push to CloudSDK if token is active
            const token = localStorage.getItem('vcsky.key');
            if (token && token.length === 5) {
                CloudSDK.pushToStorage(token, savesFile, payload).catch(err => console.warn('[CloudSDK] push error:', err));
            }
        });
    },
});


function updateToken(token) {
    cloudSavesStatus.textContent = t('checking');
    if (token.length === 5) {
        CloudSDK.resolveToken(token).then((profile) => {
            if (profile) {
                console.log('[CloudSdk] resolveToken', profile);
                localStorage.setItem('vcsky.key', profile.token);
                if (profile.premium) {
                    keyStatus.textContent = t('enabled');
                    keyStatus.style.color = 'green';
                    keyStatus.style.fontWeight = 'bold';
                } else {
                    keyStatus.textContent = t('disabled');
                    keyStatus.style.color = 'red';
                    keyStatus.style.fontWeight = 'bold';
                }
            } else {
                keyStatus.textContent = t('invalidKey');
                keyStatus.style.color = 'white';
                keyStatus.style.fontWeight = 'normal';
            }
        });
    } else {
        cloudSavesStatus.textContent = t('enterKey');
    }
}

const keyInput = document.querySelector('.jsdos-key-input');
const keyStatus = document.querySelector('.jsdos-key-status');
if (keyInput) {
    keyInput.setAttribute('placeholder', t("enterJsDosKey"));
    keyInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            updateToken(e.target.value);
        }, 100);
    });
    keyInput.addEventListener('keyup', (e) => {
        updateToken(e.target.value);
    });
    if (localStorage.getItem('vcsky.key')) {
        keyInput.value = localStorage.getItem('vcsky.key');
        updateToken(keyInput.value);
    }
} else if (keyStatus) {
    if (localStorage.getItem('vcsky.key')) {
        updateToken(localStorage.getItem('vcsky.key'));
    } else {
        keyStatus.textContent = t('invalidKey');
        keyStatus.style.color = 'white';
        keyStatus.style.fontWeight = 'normal';
    }
}

const clickToPlayButton = document.getElementById('click-to-play-button');
if (clickToPlayButton) {
    clickToPlayButton.textContent = t('clickToPlayFull');
    clickToPlayButton.classList.remove('disabled');
}
const demoOffDisclaimer = document.getElementById('demo-off-disclaimer');
if (demoOffDisclaimer) demoOffDisclaimer.textContent = "";
const cloudSavesLink = document.getElementById('cloud-saves-link');
if (cloudSavesLink) cloudSavesLink.textContent = t('cloudSaves');
if (cloudSavesStatus) cloudSavesStatus.textContent = t('enterKey');
const playDemoText = document.getElementById('play-demo-text');
if (playDemoText) playDemoText.textContent = "";
const disclaimerCheckbox = document.getElementById('disclaimer-checkbox');
const originalGameFile = document.getElementById('original-game-file');
const developedBy = document.querySelector('.developed-by');
if (developedBy) developedBy.innerHTML += t('ruTranslate');
const portBy = document.getElementById('port-by');
if (portBy) portBy.textContent = t('portBy');

function ownerShipConfirmed() {
    try { localStorage.setItem('vcsky.haveOriginalGame', 'true'); } catch (e) {}
    if (disclaimerCheckbox) disclaimerCheckbox.checked = true;
    if (clickToPlayButton) {
        clickToPlayButton.textContent = t('clickToPlayFull');
        clickToPlayButton.classList.remove('disabled');
    }
    if (demoOffDisclaimer) demoOffDisclaimer.textContent = "";
    haveOriginalGame = true;
};

function ownerShipNotConfirmed() {
    ownerShipConfirmed();
};

ownerShipConfirmed();

function showWasted() {
    const wastedContainer = document.querySelector('.wasted-container');
    wastedContainer.hidden = false;
}

const revc_iniDefault = `
[VideoMode]
Width=800
Height=600
Depth=32
Subsystem=0
Windowed=0
[Controller]
HeadBob1stPerson=0
HorizantalMouseSens=0.002500
InvertMouseVertically=1
DisableMouseSteering=1
Vibration=0
Method=${isTouch ? '1' : '0'}
InvertPad=0
JoystickName=
PadButtonsInited=0
[Audio]
SfxVolume=36
MusicVolume=37
MP3BoostVolume=0
Radio=0
SpeakerType=0
Provider=0
DynamicAcoustics=1
[Display]
Brightness=256
DrawDistance=1.800000
Subtitles=0
ShowHud=1
RadarMode=0
ShowLegends=0
PedDensity=1.200000
CarDensity=1.200000
CutsceneBorders=1
FreeCam=0
[Graphics]
AspectRatio=0
VSync=1
Trails=1
FrameLimiter=0
MultiSampling=0
IslandLoading=0
PS2AlphaTest=1
ColourFilter=2
MotionBlur=0
VehiclePipeline=0
NeoRimLight=0
NeoLightMaps=0
NeoRoadGloss=0
[General]
SkinFile=$$""
Language=0
DrawVersionText=0
NoMovies=0
[CustomPipesValues]
PostFXIntensity=1.000000
NeoVehicleShininess=1.000000
NeoVehicleSpecularity=1.000000
RimlightMult=1.000000
LightmapMult=1.000000
GlossMult=1.000000
[Rendering]
BackfaceCulling=1
NewRenderer=1
[Draw]
ProperScaling=1
FixRadar=1
FixSprites=1
[Bindings]
PED_FIREWEAPON=mouse:LEFT,2ndKbd:PAD5
PED_CYCLE_WEAPON_RIGHT=2ndKbd:PADENTER,mouse:WHLDOWN,kbd:E
PED_CYCLE_WEAPON_LEFT=kbd:PADDEL,mouse:WHLUP,2ndKbd:Q
GO_FORWARD=kbd:UP,2ndKbd:W
GO_BACK=kbd:DOWN,2ndKbd:S
GO_LEFT=2ndKbd:A,kbd:LEFT
GO_RIGHT=kbd:RIGHT,2ndKbd:D
PED_SNIPER_ZOOM_IN=kbd:PGUP,2ndKbd:Z,mouse:WHLUP
PED_SNIPER_ZOOM_OUT=kbd:PGDN,2ndKbd:X,mouse:WHLDOWN
VEHICLE_ENTER_EXIT=kbd:ENTER,2ndKbd:F
CAMERA_CHANGE_VIEW_ALL_SITUATIONS=kbd:HOME,2ndKbd:V
PED_JUMPING=kbd:RCTRL,2ndKbd:SPC
PED_SPRINT=2ndKbd:LSHIFT,kbd:RSHIFT
PED_LOOKBEHIND=2ndKbd:CAPSLK,mouse:MIDDLE,kbd:PADINS
PED_DUCK=kbd:C
PED_ANSWER_PHONE=kbd:TAB
VEHICLE_FIREWEAPON=kbd:PADINS,2ndKbd:LCTRL,mouse:LEFT
VEHICLE_ACCELERATE=2ndKbd:W
VEHICLE_BRAKE=2ndKbd:S
VEHICLE_CHANGE_RADIO_STATION=kbd:INS,2ndKbd:R
VEHICLE_HORN=2ndKbd:LSHIFT,kbd:RSHIFT
TOGGLE_SUBMISSIONS=kbd:PLUS,2ndKbd:CAPSLK
VEHICLE_HANDBRAKE=kbd:RCTRL,2ndKbd:SPC,mouse:RIGHT
PED_1RST_PERSON_LOOK_LEFT=kbd:PADLEFT
PED_1RST_PERSON_LOOK_RIGHT=kbd:PADHOME
VEHICLE_LOOKLEFT=kbd:PADEND,2ndKbd:Q
VEHICLE_LOOKRIGHT=kbd:PADDOWN,2ndKbd:E
VEHICLE_LOOKBEHIND=mouse:MIDDLE
VEHICLE_TURRETLEFT=kbd:PADLEFT
VEHICLE_TURRETRIGHT=kbd:PAD5
VEHICLE_TURRETUP=kbd:PADPGUP,2ndKbd:UP
VEHICLE_TURRETDOWN=kbd:PADRIGHT,2ndKbd:DOWN
PED_CYCLE_TARGET_LEFT=kbd:[,2ndKbd:PADEND
PED_CYCLE_TARGET_RIGHT=2ndKbd:],kbd:PADDOWN
PED_CENTER_CAMERA_BEHIND_PLAYER=kbd:#
PED_LOCK_TARGET=kbd:DEL,mouse:RIGHT,2ndKbd:PADRIGHT
NETWORK_TALK=kbd:T
PED_1RST_PERSON_LOOK_UP=kbd:PADPGUP
PED_1RST_PERSON_LOOK_DOWN=kbd:PADUP
_CONTROLLERACTION_36=
TOGGLE_DPAD=
SWITCH_DEBUG_CAM_ON=
TAKE_SCREEN_SHOT=
SHOW_MOUSE_POINTER_TOGGLE=
UNKNOWN_ACTION=

`;

const revc_ini = (() => {
    const cached = localStorage.getItem('vcsky.revc.ini');
    if (cached) {
        return cached;
    }
    return revc_iniDefault;
})();

// Configurable mode UI
if (configurableMode) {
    const configPanel = document.getElementById('config-panel');
    const configLang = document.getElementById('config-lang');
    const configCheats = document.getElementById('config-cheats');
    const configFullscreen = document.getElementById('config-fullscreen');
    const configMaxFps = document.getElementById('config-max-fps');
    
    if (configPanel && configCheats && configFullscreen && configMaxFps) {
        // Show config panel
        configPanel.style.display = 'block';
        
        // Set initial values from URL params
        if (configLang) configLang.value = currentLanguage;
        configCheats.checked = cheatsEnabled;
        configFullscreen.checked = autoFullScreen;
        configMaxFps.value = maxFPS;
        
        // Update config panel labels with current language
        updateAllTranslations();
        
        // Language selector handler
        if (configLang) {
            configLang.addEventListener('change', (e) => {
                currentLanguage = e.target.value;
                updateGameDataForLanguage(currentLanguage);
                updateAllTranslations();
            });
        }
        
        // Update settings when changed
        configCheats.addEventListener('change', (e) => {
            cheatsEnabled = e.target.checked;
        });
        
        configFullscreen.addEventListener('change', (e) => {
            autoFullScreen = e.target.checked;
        });
        
        configMaxFps.addEventListener('input', (e) => {
            maxFPS = parseInt(e.target.value) || 0;
        });
    }
}

// Global utilities for local saves management via console if needed
window.exportSaves = function() {
    const localSaved = localStorage.getItem('vcsky.local_saves');
    if (!localSaved) {
        console.warn('No local browser saves found yet! Play the game and save at any safehouse first.');
        return;
    }
    const bytes = base64ToUint8(localSaved);
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gtavc_save_${new Date().toISOString().slice(0, 10)}.saves`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Saves exported successfully.');
};

window.importSaves = function() {
    document.getElementById('import-save-file')?.click();
};

window.clearSaves = function() {
    localStorage.removeItem('vcsky.local_saves');
    console.log('Local saves cleared.');
};

// Automatically launch the game directly
let autoStarted = false;
function triggerAutoStart() {
    if (autoStarted) return;
    autoStarted = true;
    startGame();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', triggerAutoStart);
} else {
    triggerAutoStart();
}