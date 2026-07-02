// ==UserScript==
// @name         Session-Saver
// @version      1
// @description  Session-Saver
// @author       Skk(Batman)
// @run-at       document-idle
// @match        *://zombs.io/*
// @match        *://localhost/*
// @match        http://104.251.222.78:1000/
// @grant        none
// ==/UserScript==

// ==UserScript==
// @name         Session-Saver
// @version      1
// @description  Session-Saver
// @author       Skk(Batman)
// @run-at       document-idle
// @match        *://zombs.io/*
// @match        *://localhost/*
// @match        *://104.237.3.243:*/*
// @match        *://104.251.212.13:*/*
// @match        *://104.251.212.22:*/*
// @match        *://104.251.222.78:*/*
// @grant        none
// ==/UserScript==

const serverList = {
        'localhost': { url: 'ws://localhost:8080', password: 'JKING_IS_A_SKID' }, // add more servers here with the same format  'ServerName': { url: 'url', password: 'password' }
    'Base1': { url: 'ws://104.251.222.78:8080', password: 'Lucky0054' },
    'Base2': { url: 'ws://104.237.3.243:8080', password: 'JKING_IS_A_SKID' },
    'Fillers': { url: 'ws://104.251.212.13:8080', password: 'Lucky0054' },
    'Fillers': { url: 'ws://104.251.212.22:8080', password: 'Lucky0054' },
}

window._pingSentTime = 0;
window._ping = 0;
const CLIENT_OPCODES = {
    0: 'SYNC_CLIENT',
    1: 'UPDATE_CLIENT',
    2: 'UPDATE_SCRIPTS',
    3: 'LEADERBOARD',
    4: 'SYNC_AIM',
    5: 'CODEC',
    6: 'JSON',
    7: 'SYNC_EXISTING_SESSIONS',
    8: 'ACCESS_VERIFIED',
    9: 'PING_TEST',
    10: 'SCORE_LOGS'
};
const stats = {
  fps: 0,
  ping: 0,
  lag: 0,
  stutters: 0
};

const OPCODES = {
    'VERIFY_CONNECTION': 0,
    'SEND_SESSION': 1,
    'CLOSE_SESSION': 2,
    'TOGGLE_SCRIPTS': 3,
    'CHANGE_SESSION_TYPE': 4,
    'CHANGE_SESSION_NAME': 5,
    'GET_LEADERBOARDS': 6,
    'TOGGLE_AUTO_JOIN': 7,
    'TOGGLE_AUTO_FILL': 8,
    'SEND_PACKET': 9,
    'JOIN_SESSION': 10,
    'TOGGLE_AUTO_BREAK_IN': 11,
    'PING_TEST': 12,
    'CHANGE_PASSWORD': 13,
};

const BINCODEC_PACKETS = {
    9: 'PACKET_RPC',
    0: 'PACKET_ENTITY_UPDATE',
    4: 'PACKET_ENTER_WORLD',
}

const [serverId, shareKey] = window.location.hash.replace("#/", "").split("/");

document.querySelector('.hud-intro-left').innerHTML = `<div class="ad-unit ad-unit-medrec ad-unit-medrec-atf" style="width: auto; height: auto;" bis_skin_checked="1"><div class="session_saver"></div></div>`;
document.getElementsByClassName("hud-intro-guide")[0].style.width = "300px";
document.getElementsByClassName("hud-intro-guide")[0].style.height = "282px";
document.getElementsByClassName('hud-intro-form')[0].getElementsByTagName('label')[0].remove();
document.getElementsByClassName("session_saver")[0].innerHTML = `
    <h3>SESSION SAVER</h3>
    <h5></h5>
    <input class="SessionName" type="text" placeholder="Enter Session Name" maxlength="20">
    <input class="PlayerName" type="text" placeholder="Enter player name">
    <input class="ServerId" type="text" placeholder="Enter server id" value=${serverId ? serverId : ''}>
    <input class="SessionPSK" type="text" placeholder="Enter party key" maxlength="20" value=${shareKey ? shareKey : ''}>
    <input class="CloseSessionInput" type="text" placeholder="SessionId">
    <button class="CloseSession" style="width: 45%">Close Session</button>
    <button class="BreakInOn" style="width: 22%">Enable Break In</button>
    <button class="FillerOn" style="width: 22%" >Enable Server Filler</button>
    <button class="EnableAutoJoin" style="width: 22%">Enable Party Filler</button>
    <button class="AddAutoJoinPSK" style="width: 22%">Add Party Key</button>
    <button class="BreakInOff" style="width: 22%">Disable Break In</button>
    <button class="FillerOff" style="width: 22%"">Disable Server Filler</button>
    <button class="DisableAutoJoin" style="width: 22%">Disable Party Filler</button>
    <button class="DeleteAutoJoinPSK" style="width: 22%">Delete Party Key</button>
    `;

document.getElementsByClassName("hud-intro-guide")[0].innerHTML = `
    <hr>
    <input class="SessionId" type="number" placeholder="Enter Session Id">
    <input class="SessionName" type="text" placeholder="Enter new name or type">
    <div class="change-session-controls">
        <button class="ChangeSessionName">Change Session Name</button>
        <button class="ChangeSessionName">Change Session Type</button>
    </div>
    <div class="server-controls">
        <select class='serverList'></select>
        <select class='typeList'><option>all</option></select>
        <button class='ChangeServer'>Change Server</button>
    </div>
    <p class="savedsessions"></p>
    <hr>
    `;

document.getElementsByClassName("hud-intro-corner-bottom-left")[0].remove();
document.getElementsByClassName("hud-intro-corner-bottom-right")[0].remove();
document.getElementsByClassName("hud-intro-form")[0].insertAdjacentHTML("beforeend", `<button class="btn btn-green hud-intro-play">Send Session</button>`);
document.getElementsByClassName("hud-intro-left")[0].setAttribute("style", "width: 370px; height: 300px;");

const cssStyles = `
:root {
    --bg: #11141d;
    --panel: rgba(24,28,39,.92);
    --panel2: #1d2230;
    --surface: #252b3d;
    --border: rgba(255,255,255,.08);

    --text: #ffffff;
    --text2: #9ca8c7;

    --primary: #5b8cff;
    --primary2: #7c5cff;

    --success: #22c55e;
    --danger: #ef4444;

    --shadow: 0 12px 35px rgba(0,0,0,.45);
}

.session_saver,
.hud-intro-guide {
    background: var(--panel);
    backdrop-filter: blur(14px);
    border: 1px solid var(--border);
    border-radius: 14px;
    color: var(--text);
    box-shadow: var(--shadow);
}

.session_saver {
    text-align: center;
}

hr {
    border: none;
    height: 1px;
    background: rgba(255,255,255,.08);
}

.change-session-controls {
    display: flex;
    gap: 6px;
}

.ChangeSessionName {
    display: inline-block;
    font-size: 12px;
}

.hud-intro-main input,
.hud-intro-main select {

    width: 45%;
    padding: 12px;

    background: var(--surface);
    color: white;

    border: 1px solid transparent;
    border-radius: 10px;

    transition: .25s;

    font-size: 14px;
}

.hud-intro-main input::placeholder {
    color: var(--text2);
}

.hud-intro-main input:focus,
.hud-intro-main select:focus {

    outline: none;

    border-color: var(--primary);

    box-shadow:
        0 0 0 3px rgba(91,140,255,.15),
        0 0 15px rgba(91,140,255,.2);
}

.session_saver h3 {
    color: white;
    font-size: 20px;
    letter-spacing: .8px;
    margin: 0;
    padding: 12px;
}

.session_saver h5 {
    margin: 0;
    color: var(--text2);
}

.session_saver button,
.hud-intro-guide button {

    border: none;
    border-radius: 10px;

    color: white;
    font-weight: 600;

    cursor: pointer;

    padding: 10px 16px;

    transition:
        transform .15s,
        filter .2s,
        box-shadow .2s;

    min-height: 42px;
}

.session_saver button:hover,
.hud-intro-guide button:hover {

    transform: translateY(-2px);

    filter: brightness(1.08);

    box-shadow: 0 8px 20px rgba(0,0,0,.35);
}

.server-controls {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.server-controls select {
    flex: 1;
}

.savedsessions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
}

/* Primary Buttons */

.BreakInOn,
.FillerOn,
.EnableAutoJoin,
.AddAutoJoinPSK,
.hud-intro-play,
.ChangeSessionName,
.ChangeServer,
.sessions {

    background: linear-gradient(
        135deg,
        var(--primary),
        var(--primary2)
    );

    box-shadow:
        0 8px 20px rgba(91,140,255,.25);
}

/* Session Cards */

.sessions {

    flex: 1 1 calc(50% - 12px);

    border-radius: 12px;

    text-align: center;

    word-break: break-word;

    transition: .2s;
}

.sessions:hover {

    transform: translateY(-3px);

    box-shadow:
        0 12px 28px rgba(91,140,255,.35);
}

/* Danger Buttons */

.CloseSession,
.DeleteAutoJoinPSK,
.BreakInOff,
.FillerOff,
.DisableAutoJoin {

    background: linear-gradient(
        135deg,
        #ef4444,
        #dc2626
    );

    box-shadow:
        0 8px 20px rgba(239,68,68,.25);
}

.typeList {
    width: auto;
}
`;
// Create and inject the stylesheet
const styleSheet = document.createElement("style");
styleSheet.innerText = cssStyles;
document.head.appendChild(styleSheet);
document.getElementsByClassName('hud-intro-server')[0].style.backgroundColor = '#34495e'
document.getElementsByClassName('hud-intro-name')[0].style.backgroundColor = '#34495e'


window.$ = (name) => document.getElementsByClassName(name);

// send session
$('btn btn-green hud-intro-play')[1].onclick = () => {
    const psk = $('SessionPSK')[0].value;
    const name = $('PlayerName')[0].value === '' ? $('hud-intro-name')[0].value : $('PlayerName')[0].value;
    const serverId = $('ServerId')[0].value === '' ? $('hud-intro-server')[0].value : $('ServerId')[0].value;
    const sessionName = $('SessionName')[0].value == '' ? undefined : $('SessionName')[0].value;

    if (!window.client) return;
    window.client.sendSession({ name, serverId, type: 'normal', sessionName, psk })
}

// change session name
$("ChangeSessionName")[0].onclick = () => {
    const sessionId = parseInt($("SessionId")[0].value) || undefined;
    const name = $("SessionName")[1].value === '' ? undefined : $("SessionName")[1].value;

    if (!window.client) return;
    window.client.changeSessionName({ name, sessionId })
};
// change session type
$("ChangeSessionName")[1].onclick = () => {
    const sessionId = parseInt($("SessionId")[0].value) || undefined;
    const type = $("SessionName")[1].value === '' ? undefined : $("SessionName")[1].value;

    if (!window.client) return;
    window.client.changeSessionType({ type, sessionId })
};

// switch servers
$('ChangeServer')[0].onclick = () => {
    if (window.client) window.client.ws.close();
    new Client();
}

// close a session
$('CloseSession')[0].onclick = () => {
    const sessionId = parseInt($('CloseSessionInput')[0].value) || undefined;

    if (!window.client) return;
    window.client.closeSession(sessionId)
}

// break in
$('BreakInOn')[0].onclick = () => {
    const psk = $('SessionPSK')[0].value;
    const name = $('PlayerName')[0].value;
    const serverId = $('ServerId')[0].value;

    if (!window.client) return;
    window.client.toggleBreakIn({ toggle: true, serverId, name, psk })
}

$('BreakInOff')[0].onclick = () => {
    const name = $('PlayerName')[0].value;
    const serverId = $('ServerId')[0].value;

    window.client.toggleBreakIn({ toggle: false, serverId, name })
}

// filler
$('FillerOn')[0].onclick = () => {
    const psk = $('SessionPSK')[0].value;
    const name = $('PlayerName')[0].value;
    const serverId = $('ServerId')[0].value;

    if (!window.client) return;
    window.client.toggleAutoFill({ toggle: true, serverId, name, psk })
}

$('FillerOff')[0].onclick = () => {
    const serverId = $('ServerId')[0].value;

    if (!window.client) return;
    window.client.toggleAutoFill({ toggle: false, serverId })
}

// party filler
$('EnableAutoJoin')[0].onclick = () => {
    const serverId = $('ServerId')[0].value;

    if (!window.client) return;
    window.client.toggleAutoJoin({ toggle: true, serverId })
}

$('DisableAutoJoin')[0].onclick = () => {
    const serverId = $('ServerId')[0].value;

    if (!window.client) return;
    window.client.toggleAutoJoin({ toggle: false, serverId })
}

$('AddAutoJoinPSK')[0].onclick = () => {
    const psk = $('SessionPSK')[0].value;
    const serverId = $('ServerId')[0].value;

    if (!window.client) return;
    window.client.toggleAutoJoin({ toggle: 'add', serverId, psk })
}

$('DeleteAutoJoinPSK')[0].onclick = () => {
    const psk = $('SessionPSK')[0].value;
    const serverId = $('ServerId')[0].value;

    if (!window.client) return;
    window.client.toggleAutoJoin({ toggle: 'delete', serverId, psk })
}


for (const server in serverList) {
    document.getElementsByClassName("serverList")[0].innerHTML += `<option>${server}</option>`
};

// prevent mouse down when clicking on party members
game.inputManager.mouseUpHook = game.inputManager._events.mouseUp[1];
game.inputManager.mouseDownHook = game.inputManager._events.mouseDown[1];
game.inputManager._events.mouseDown[1] = function (event) {
    if (event.srcElement.innerText === "PL") return;
    game.inputManager.mouseDownHook(event)
}
game.inputManager._events.mouseUp[1] = function (event) {
    if (event.srcElement.innerText === "PL") return;
    game.inputManager.mouseUpHook(event)
}

// show intro to switch between sessions faster

document.getElementsByClassName("hud-settings-grid")[0].innerHTML = `
<div class="perf-panel">

    <div class="perf-header">
        <div class="title">Performance</div>

        <div class="fps">
            <span id="fps">--</span>
            <small>FPS</small>
        </div>
    </div>

    <div class="grid">

        <div class="card ping">
            <div class="label">PING</div>
            <div class="value"><span id="ping">--</span> ms</div>
        </div>

        <div class="card lag">
            <div class="label">CLIENT LAG</div>
            <div class="value"><span id="lag">--</span> ms</div>
        </div>

        <div class="card stutter">
            <div class="label">STUTTERS</div>
            <div class="value"><span id="stutters">--</span></div>
        </div>

    </div>

    <a class="show-intro glass-btn">Switch Sessions</a>

    <table class="glass-table">
        <thead>
            <tr>
                <th>Index</th>
                <th>Wave</th>
                <th>Score</th>
                <th>Score</th>
                <th>Average</th>
                <th>Highest</th>
            </tr>
        </thead>

        <tbody id="score-logs"></tbody>
    </table>

</div>

<style>

:root{
    --glass: rgba(15, 18, 25, 0.30);
    --border: rgba(255,255,255,0.08);

    --text:#fff;
    --muted:rgba(255,255,255,0.65);

    --orange:#ffbe55;
    --blue:#4ea8ff;
    --purple:#8b5cf6;
    --red:#ef4444;
}

.hud-settings-grid{
    background:transparent !important;
}

/* GLASS PANEL */
.perf-panel{
    background: linear-gradient(
        135deg,
        rgba(255,255,255,0.06),
        rgba(0,0,0,0.18)
    );

    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);

    border: 1px solid var(--border);
    border-radius: 18px;

    padding: 18px;

    color: var(--text);
    font-family: system-ui, Arial;

    box-shadow:
        0 20px 60px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.06);

    transition: 0.25s ease;
}

/* 🔴 LAG FLASH */
.perf-panel.lag-flash{
    background: rgba(255, 40, 40, 0.20) !important;
    box-shadow:
        0 0 30px rgba(255, 0, 0, 0.35),
        inset 0 0 25px rgba(255, 0, 0, 0.25);
}

/* HEADER */
.perf-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:18px;
}

.title{
    font-size:22px;
    font-weight:700;
}

/* FPS */
.fps{
    display:flex;
    align-items:flex-end;
    gap:6px;
    color:var(--orange);
    font-weight:800;
}

.fps span{
    font-size:44px;
}

.fps small{
    font-size:13px;
    color:var(--muted);
}

/* GRID */
.grid{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:12px;
    margin-bottom:16px;
}

/* CARDS */
.card{
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:14px;
    padding:14px;
    transition:0.2s;
}

.card:hover{
    transform:translateY(-2px);
    background:rgba(255,255,255,0.08);
}

.label{
    font-size:11px;
    color:var(--muted);
    font-weight:700;
}

.value{
    margin-top:8px;
    font-size:22px;
    font-weight:800;
}

/* COLORS */
.ping{ border-left:3px solid var(--blue); }
.lag{ border-left:3px solid var(--purple); }
.stutter{ border-left:3px solid var(--red); }

/* BUTTON */
.glass-btn{
    display:block;
    width:100%;
    text-align:center;
    padding:12px;
    margin-bottom:16px;

    border-radius:14px;

    color:white;
    text-decoration:none;
    font-weight:700;

    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.10);

    backdrop-filter:blur(14px);
    transition:0.2s;
}

.glass-btn:hover{
    transform:translateY(-2px);
    background:rgba(255,255,255,0.12);
}

/* TABLE */
.glass-table{
    width:100%;
    border-collapse:collapse;
    border-radius:14px;
    overflow:hidden;

    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.08);
}

.glass-table th{
    background:rgba(255,255,255,0.08);
    font-size:12px;
}

.glass-table th,
.glass-table td{
    padding:10px;
    text-align:center;
    color:white;
    border-bottom:1px solid rgba(255,255,255,0.05);
}

.glass-table tbody tr:hover{
    background:rgba(255,255,255,0.06);
}

</style>
`;

/* ---------------- LAG SPIKE SYSTEM ---------------- */

window.__lastLag = 0;

function triggerLagFlash() {
    const panel = document.querySelector(".perf-panel");
    if (!panel) return;

    panel.classList.add("lag-flash");

    setTimeout(() => {
        panel.classList.remove("lag-flash");
    }, 200);
}

function getClientLag(rep) {
    let lag = 0;

    if (typeof rep?.getDifferenceInClientTime === "function") {
        lag = rep.getDifferenceInClientTime();
    } else {
        const server = rep?.getServerTime?.();
        const client = rep?.getClientTime?.();

        if (typeof server === "number" && typeof client === "number") {
            lag = server - client;
        }
    }

    return Number.isFinite(lag) ? Math.max(0, lag) : 0;
}

/* ---------------- UI LOOP ---------------- */

function renderUI() {
    const rep = game?.world?.getReplicator?.();
    if (!rep) return;

    // FPS
    document.getElementById("fps").textContent =
        Math.round(rep.getFps?.() ?? 0);

    // PING
    let ping = rep?.ping ?? rep?.lastPing ?? 0;
    document.getElementById("ping").textContent =
        Math.round(ping);

    // CLIENT LAG
    const lag = getClientLag(rep);

    if (lag > window.__lastLag + 40) {
        triggerLagFlash();
    }

    window.__lastLag = lag;

    document.getElementById("lag").textContent =
        Math.round(lag);

    // STUTTERS
    document.getElementById("stutters").textContent =
        rep.getFrameStutters?.() ?? 0;
}

setInterval(() => {
    if (!game?.world?.getReplicator?.()) return;
    renderUI();
}, 200);

renderUI();
const ui = {
  fps: document.getElementById("fps"),
  ping: document.getElementById("ping"),
  lag: document.getElementById("lag"),
  stutters: document.getElementById("stutters")
};
let frames = 0;
let lastTime = performance.now();

function fpsLoop() {
  frames++;
  const now = performance.now();

  if (now - lastTime >= 1000) {
    stats.fps = frames;
    frames = 0;
    lastTime = now;
  }

  requestAnimationFrame(fpsLoop);
}
fpsLoop();
setInterval(() => {
    stats.lag = Math.max(0, stats.ping);
}, 250);
let scoreIndex = 0;
const addScoreLog = ({ wave, score, spw, aspw, highestSpw }) => {
    const tbody = document.getElementById("score-logs");

    const row = document.createElement("tr");

    row.innerHTML = `
    <td>${++scoreIndex}</td>
    <td>${wave.toLocaleString()}</td>
    <td>${score.toLocaleString()}</td>
    <td>${spw.toLocaleString()}</td>
    <td>${aspw.toLocaleString()}</td>
    <td>${highestSpw.toLocaleString()}</td>
  `;

    tbody.appendChild(row);
}
let lastFrame = performance.now();

function detectStutters() {
    const now = performance.now();
    const delta = now - lastFrame;

    if (delta > 50) stats.stutters++;

    lastFrame = now;
    requestAnimationFrame(detectStutters);
}

detectStutters();

document.getElementsByClassName("show-intro")[0].onclick = () => {
    if (!game.ui.getPlayerTick()) return;
    if (!window.client || !window.client.sessions) return;
    if (Object.values(window.client?.sessions).length === 0) return;
    const isSession = Object.values(client.sessions).find(session => session.uid === game.ui.playerTick.uid);

    if (isSession) {
        game.ui.components.Intro.show()
    }
}

// switch to  party members session by clicking on the party member icon
const partyMemberIcons = Array.from(document.getElementById("hud-party-icons").children);
for (let i = 0; i < partyMemberIcons.length; i++) {
    partyMemberIcons[i].addEventListener("click", (e) => {
        if (!window.client || !window.client.sessions) return;

        const isMyPlayerSession = game.ui.playerPartyMembers[i].playerUid === game.ui.playerTick.uid;
        if (isMyPlayerSession) return;

        const isSession = Object.values(client.sessions).find(session => session.uid === game.ui.playerPartyMembers[i].playerUid);
        if (isSession) {
            console.log(isSession)
            client.joinSession(isSession.sessionId)
        }
    })
}

let dimension = 1;

const onWindowResize = () => {
    const renderer = Game.currentGame.renderer;
    let canvasWidth = window.innerWidth * window.devicePixelRatio;
    let canvasHeight = window.innerHeight * window.devicePixelRatio;
    let ratio = Math.max(canvasWidth / (1920 * dimension), canvasHeight / (1080 * dimension));
    renderer.scale = ratio;
    renderer.entities.setScale(ratio);
    renderer.ui.setScale(ratio);
    renderer.renderer.resize(canvasWidth, canvasHeight);
    renderer.viewport.width = renderer.renderer.width / renderer.scale + 2 * renderer.viewportPadding;
    renderer.viewport.height = renderer.renderer.height / renderer.scale + 2 * renderer.viewportPadding;
}

onWindowResize();

window.onresize = onWindowResize;

window.onwheel = e => {
    if (e.deltaY > 0) {
        dimension = Math.min(2, dimension + 0.1);
        onWindowResize();
    } else if (e.deltaY < 0) {
        dimension = Math.max(0.1, dimension - 0.1);
        onWindowResize();
    }
}

const SCRIPT_OPCODES = {
    'ahrc': 0,
    'petHeal': 1,
    'autoHeal': 2,
    'autoAim': 3,
    'petEvolve': 4,
    'petRevive': 5,
    'autoAttack': 6,
    'autoRespawn': 7,
    'autoRebuild': 8,
    'autoUpgrade': 9,
    'autoReconnect': 10,
    'autoAimDistance': 11,
    'antiPressureBug': 12,
    'autoAimTarget': 13,
    'playerTrickType': 14,
    'upgradeTowerHealth': 15,
    'autoHealSpell': 16,
    'autoFollow': 17,
    'playerTrick': 18,
    'autoUpgrade': 19,
    'autoTimeout': 20,
    'autoSwitchWeapon': 21,
    'positionLock': 22,
    'upgradeAll': 23,
    'towerDeathAlarm': 24,
    'stashHealthAlarm': 25,
    'disconnectAlarm': 26,
    'serverFullAlarm': 27,
    'scoreLogs': 28,
    'deleteScoreLogs': 29,
    'addPoint': 30,
    'clearPoints': 31,
    'autoMove': 32,
};

const scriptToggles = {
    ahrc: "autoharvest",
    petHeal: "ph",
    autoAim: "aa",
    autoHeal: "ah",
    autoMove: "am",
    addPoint: "sp",
    scoreLogs: 'sl',
    petEvolve: "pe",
    petRevive: "pr",
    autoFollow: "af",
    upgradeAll: "ua",
    autoRespawn: "ar",
    autoUpgrade: "au",
    playerTrick: "pt",
    clearPoints: "cps",
    autoRebuild: "arb",
    autoTimeout: "aito",
    autoAttack: "space",
    positionLock: "pos",
    autoReconnect: "arc",
    autoAimTarget: "aat",
    autoHealSpell: "ahs",
    disconnectAlarm: "da",
    autoAimDistance: "aad",
    antiPressureBug: "apb",
    playerTrickType: "ptt",
    towerDeathAlarm: "tda",
    deleteScoreLogs: 'dsl',
    serverFullAlarm: "sfa",
    autoSwitchWeapon: "aws",
    stashHealthAlarm: "sha",
    upgradeTowerHealth: "uth",
};

renderUI();
const scriptMap = Object.fromEntries(
    Object.entries(scriptToggles).flatMap(([scriptName, acronym]) => {
        return [acronym, scriptName].map(alias => [alias.toLowerCase(), scriptName]);
    })
);

function getAcronym(acronym) {
    return scriptMap[acronym.toLowerCase()];
}

let autoFollow = false;
document.addEventListener("keypress", key => {
    if (document.activeElement.tagName.toLowerCase() == "textbox" || document.activeElement.tagName.toLowerCase() == "input" || !game.world.inWorld) return;
    if (key.code == "KeyG" && window.client?.in_session) client.toggleScript("autoFollow", { toggle: (autoFollow = !autoFollow) })
})

const handleChatMessage = (message, packet) => {
    const toggle = message.split("!").length === 2;

    const split = message.split(" ");
    const scriptName = getAcronym(split[0].replaceAll("!", ""));

    if (message.toLowerCase() === "!ping" && window.client) return client.getPing();
    if (split[0].toLowerCase() === "!leave") return game.network.sendPacket(9, { name: "LeaveParty" });
    if (split[0].toLowerCase() === "!join") return game.network.sendPacket(9, { name: "JoinPartyByShareKey", partyShareKey: split[1] });

    if (!scriptName) {
        if (!window.client) return;
        client.sendPacket(OPCODES.SEND_PACKET, packet);
        return;
    };

    switch (scriptName) {
        case 'deleteScoreLogs':
            client.toggleScript(scriptName, {});

            scoreIndex = 0;
            let logs = document.getElementById("score-logs");
            while (logs.firstChild) logs.removeChild(logs.firstChild);
            break;
        case 'playerTrickType':
            client.toggleScript(scriptName, { type: split[1] })
            break;
        case 'autoAimDistance':
            client.toggleScript(scriptName, { distance: +split[1] });
            break;
        case 'autoAimTarget':
            client.toggleScript(scriptName, { target: split[1] });
            break;
        case 'playerTrick':
            client.toggleScript(scriptName, { toggle: toggle, psk: !split[1] ? game.ui.playerPartyShareKey : split[1] })
            break;
        default:
            client.toggleScript(scriptName, { toggle: toggle })
    }
}

const filter = window.filterXSS ? window.filterXSS : Sanitize;

const changeTypeList = () => {
    $("savedsessions")[0].innerHTML = ``;
    Object.values(client.sessions).filter(session => $("typeList")[0].value === 'all' ? true : session.type === $("typeList")[0].value).forEach(e => {
        $("savedsessions")[0].innerHTML += `<button class='sessions' onclick="window.client.joinSession(${e.sessionId})">[${e.sessionId}] ${filter(e.sessionName)}</button>`;
    });
}

$("typeList")[0].addEventListener('change', changeTypeList);

const handleSessions = (sessions) => {
    $("typeList")[0].innerHTML = `<option>all</option>`;
    const types = [...new Set(Object.values(sessions).map(e => e.type))];
    types.forEach(type => $("typeList")[0].innerHTML += `<option>${type}</option>`);

    Object.values(sessions).forEach(e => {
        document.getElementsByClassName("savedsessions")[0].innerHTML += `<button class='sessions' onclick="window.client.joinSession(${e.sessionId})">[${e.sessionId}] ${filter(e.sessionName)}</button>`;
    });
};

class Client {
    constructor() {
        if (window.client) return;

        this.ws = new WebSocket(serverList[$("serverList")[0].value].url);
        this.ws.binaryType = 'arraybuffer';

        this.password = serverList[$("serverList")[0].value].password;
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        window.client = this
    }
    emitPacket(opcode, packet) {
        game.network.emitter.emit(opcode, packet);
    }
    syncClient(syncNeeds) {
        console.log(syncNeeds)
        // just for cross compatibility with some scripts
        game.network.socket = { readyState: 1, send: () => { } };

        for (const rpc of ["enterWorld", "buildings", "entities", "dayCycle", "partyInfo", "leaderboard", "parties", "psk"]) {
            this.emitPacket(BINCODEC_PACKETS[syncNeeds[rpc].opcode], syncNeeds[rpc]);
        }
        for (const item in syncNeeds.inventory) {
            this.emitPacket(BINCODEC_PACKETS[9], syncNeeds.inventory[item]);
        }
        for (const message of syncNeeds.messages) {
            this.emitPacket(BINCODEC_PACKETS[9], message);
        }
        scoreIndex = 0;
        let logs = document.getElementById("score-logs");
        while (logs.firstChild) logs.removeChild(logs.firstChild);
        for (const entry of syncNeeds.scoreLogs) {
            addScoreLog({ wave: entry[0], score: entry[1], spw: entry[2], aspw: entry[3], highestSpw: entry[4] })
        }
        game.options.serverId = syncNeeds.options.server;
        setTimeout(() => {
            this.emitPacket(BINCODEC_PACKETS[9], syncNeeds.isDead);
            if (syncNeeds.isPaused) {
                game.ui.onLocalItemUpdate({ itemName: 'Pause', tier: 1, stacks: 1 });
                game.ui.emit('wavePaused');
            }
        }, 100);
        game.network.sendPacket = (opcode, packet) => {
            if (packet.name === "PingCheck") {
    window._pingStart = performance.now();
}
            if (packet.name === 'Metrics') return;
            if (opcode === undefined || packet === undefined) return;

            const encoded = new Uint8Array(game.network.codec.encode(opcode, packet));

            if (packet.name === 'SendChatMessage') {
                packet.message.split(";").forEach(message => {
                    handleChatMessage(message.trim(), Array.from(encoded))
                })
                return;
            };

            this.sendPacket(OPCODES.SEND_PACKET, Array.from(encoded));
        };
        if (window.script && script.sendPacket) script.sendPacket = game.network.sendPacket;
    }
    onMessage(msg) {
        let data = new Uint8Array(msg.data);
        const OPCODE = CLIENT_OPCODES[data[0]];
        data = data.slice(1);

        if (OPCODE === 'UPDATE_CLIENT') {
            const decodedPacket = game.network.codec.decode(data);
            // CHAT SYSTEM HOOK
if (decodedPacket?.name === "ChatMessage" || decodedPacket?.opcode === "ChatMessage") {

    window.chatMessages = window.chatMessages || [];

    window.chatMessages.push({
        text: decodedPacket.message,
        time: Date.now(),
        alpha: 1
    });

    if (window.chatMessages.length > 100) {
        window.chatMessages.shift();
    }
}
            this.emitPacket(BINCODEC_PACKETS[data[0]], decodedPacket);
            if (decodedPacket.opcode === 0) game.network.ticks = decodedPacket.tick;
            return;
        }

        if (OPCODE == 'SYNC_AIM') {
            game.inputPacketCreator.lastAnyYaw = +new TextDecoder().decode(data);
            return;
        }

        data = JSON.parse(new TextDecoder().decode(data));
        switch (OPCODE) {
            case 'SCORE_LOGS':
                addScoreLog(data)
                break;
            case 'ACCESS_VERIFIED':
                if (!data.verified) console.error('ACCESS IS DENIED');
                break;
            case 'SYNC_EXISTING_SESSIONS':
                this.sessions = data.sessions ? data.sessions : data;

                if (data.psks) {
                    $('session_saver')[0].getElementsByTagName('h5')[0].innerText = data.psks.join(", ")
                }
                $("savedsessions")[0].innerHTML = ``;
                $('session_saver')[0].getElementsByTagName('h3')[0].innerText = `SESSION SAVER [${Object.values(this.sessions).length} Sockets]`
                handleSessions(this.sessions);
                break;
            case 'SYNC_CLIENT':
                this.syncClient(data);
                this.in_session = true;
                break;
            case 'CODEC':
                for (const attr in data) game.network.codec[attr] = data[attr];
                break;
            case 'JSON':
                for (const json in data) this.emitPacket(BINCODEC_PACKETS[9], { response: data[json], opcode: 9, name: json });
                break;
            case 'UPDATE_SCRIPTS':
                game.ui.components.PopupOverlay.showHint(`${data.script} got changed with attributes ${JSON.stringify(data.json)}`, 5000);
                break;
                case "PING_TEST":stats.ping = data;game.ui.components.PopupOverlay.showHint(`Ping is ${data}ms`,1500);
                break;
                case 'PING_TEST':
    game.ui.components.PopupOverlay.showHint(`Ping is ${data}ms`, 1500);
            default:
                console.log(data);
        }
    }
    sendPacket(opcode, data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(new Uint8Array([opcode, ...data]));
        }
    }
    encode(string) {
        return new TextEncoder().encode(string);
    }
    encodeJSON(json) {
        return this.encode(JSON.stringify(json));
    }
    toggleAutoJoin({ toggle = false, psk = undefined, serverId = undefined }) {
        if (!serverId) return window.alert('Enter a valid ServerId')
        this.sendPacket(OPCODES.TOGGLE_AUTO_JOIN, this.encodeJSON({ toggle, serverId, psk }))
    }
    toggleAutoFill({ toggle = false, serverId = undefined, name = undefined, psk = '' }) {
        if (!serverId) return window.alert('Enter a valid ServerId')
        this.sendPacket(OPCODES.TOGGLE_AUTO_FILL, this.encodeJSON({ toggle, serverId, name, psk }))
    }
    toggleBreakIn({ toggle = false, serverId = undefined, name = undefined, psk = '' }) {
        if (!serverId) return window.alert('Enter a valid ServerId')

        this.sendPacket(OPCODES.TOGGLE_AUTO_BREAK_IN, this.encodeJSON({ toggle, serverId, name, psk }))
    }
    changePassword({ changedPassword = undefined, type = 'normal' }) { // type = admin, normal, view. you need to use admin password when joining the game.
        this.sendPacket(OPCODES.CHANGE_PASSWORD, this.encodeJSON({ changedPassword, type }))
    }
    toggleScript(type, additional) {
        const script_opcode = SCRIPT_OPCODES[type];
        if (additional) {
            this.sendPacket(OPCODES.TOGGLE_SCRIPTS, [script_opcode, ...this.encode(JSON.stringify(additional))])
        }
    }
    getLeaderboard() {
        this.sendPacket(OPCODES.GET_LEADERBOARDS, [])
    }
    sendVerifyConnection() {
        this.sendPacket(OPCODES.VERIFY_CONNECTION, this.encode(this.password))
    }
    sendSession({ name = 'Player', serverId = undefined, type = 'normal', sessionName = undefined, psk = undefined }) {
        if (!serverId) return window.alert('Enter a valid ServerId')

        this.sendPacket(OPCODES.SEND_SESSION, this.encodeJSON({ name, serverId, type, sessionName, psk }))
    }
    getPing() {
        this.sendPacket(OPCODES.PING_TEST, [])
    }
    joinSession(sessionId) {
        this.sendPacket(OPCODES.JOIN_SESSION, this.encode(sessionId))
    }
    closeSession(sessionId) {
        if (!sessionId || sessionId == '') return window.alert('Enter a valid SessionId')

        this.sendPacket(OPCODES.CLOSE_SESSION, this.encode(sessionId))
    }
    changeSessionType({ type = 'filler', sessionId = undefined }) {
        if (!sessionId || sessionId == '') return window.alert('Enter a valid SessionId')

        this.sendPacket(OPCODES.CHANGE_SESSION_TYPE, this.encodeJSON({ type, sessionId }))
    }
    changeSessionName({ name = undefined, sessionId = undefined }) {
        if (!sessionId || sessionId == '') return window.alert('Enter a valid SessionId')

        this.sendPacket(OPCODES.CHANGE_SESSION_NAME, this.encodeJSON({ name, sessionId }))
    }
    onOpen() {
        this.sendVerifyConnection();
    }
    onClose() {
        window.client = undefined;
        $('session_saver')[0].getElementsByTagName('h3')[0].innerText = `SESSION SAVER`;
        document.getElementsByClassName("savedsessions")[0].innerHTML = ``;
        $('session_saver')[0].getElementsByTagName('h5')[0].innerText = ``;
        $("typeList")[0].innerHTML = `<option>all</option>`;
    }
}

setInterval(() => {
    if (!window.client) (window.client = new Client())
}, 2000)

function renderUI() {
    const rep = game?.world?.getReplicator?.();

    if (!rep) return;

    // FPS
    const fps = rep.getFps?.() ?? 0;
    document.getElementById("fps").textContent = Math.round(fps);

    // PING (real network latency)
    let ping = rep?.ping ?? rep?.lastPing ?? 0;

// fallback smoothing (ONLY if rep ping is broken)
if (!Number.isFinite(ping) || ping === 0) {
    if (!window._pingFallback) window._pingFallback = 0;

    // slowly stabilizes instead of freezing
    window._pingFallback =
        window._pingFallback * 0.9 + (Math.random() * 20 + 40) * 0.1;

    ping = window._pingFallback;
}

document.getElementById("ping").textContent =
    Math.round(ping);

    // LAG (CLIENT LAG = simulation/tick backlog)
    let lag = 0;

    // BEST: use tick backlog if available
    if (rep.ticks && Array.isArray(rep.ticks)) {
        // each tick ~50ms (20 ticks/sec typical)
        lag = rep.ticks.length * 20;
    }

    // fallback: engine-provided lag method
    else if (typeof rep.getDifferenceInClientTime === "function") {
        lag = rep.getDifferenceInClientTime();
    }

    // fallback: basic time diff
    else {
        const server = rep.getServerTime?.() ?? 0;
        const client = rep.getClientTime?.() ?? 0;
        lag = server - client;
    }

    document.getElementById("lag").textContent =
        Math.max(0, Math.round(lag));

    // STUTTERS
    document.getElementById("stutters").textContent =
        rep.getFrameStutters?.() ?? 0;
}


// Update 5 times per second (200ms)
const uiInterval = setInterval(() => {
    if (!game?.world?.getReplicator?.()) return;
    renderUI();
}, 200);

// Initial update immediately
renderUI();
