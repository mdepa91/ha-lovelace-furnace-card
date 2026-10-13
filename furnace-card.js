// Furnace card: a Home Assistant Lovelace card that draws a boiler (CO) with a 4-way mixing valve, the heating pump on
// the hot side of the valve, the house radiators and the hot water tank (CWU) with its zone valve and electric heater.
// Pipes are coloured by temperature. The pump and the fire have no entities: they follow the boiler supply temperature
// with thresholds from the config.
const CARD_VERSION = "0.1.0";

const I18N = {
  pl: {
    title: "Kotłownia", outdoor: "Zewnętrzna", boiler_supply: "zasilanie kotła", boiler_return: "powrót kotła",
    supply: "zasilanie CO", return: "powrót CO", valve: "zawór 4D", pump: "Pompa CO", running: "praca",
    stopped: "stop", boiler: "Kocioł CO", burning: "pali się", out: "wygaszony", ash: "popielnik", house: "Dom",
    thermostat: "termostat", hotwater: "CWU", hw_valve_1: "zawór", hw_valve_2: "CWU", heater: "grzałka",
    no_flow: "brak przepływu",
  },
  en: {
    title: "Boiler room", outdoor: "Outdoor", boiler_supply: "boiler supply", boiler_return: "boiler return",
    supply: "heating supply", return: "heating return", valve: "4-way valve", pump: "Heating pump", running: "running",
    stopped: "stopped", boiler: "Boiler", burning: "burning", out: "out", ash: "ash pan", house: "House",
    thermostat: "thermostat", hotwater: "DHW", hw_valve_1: "DHW", hw_valve_2: "valve", heater: "heater",
    no_flow: "no flow",
  },
};

const EDITOR_I18N = {
  pl: {
    title: "Tytuł", language: "Język", entities: "Encje", logic: "Pompa i palenie (bez encji)", scale: "Skala kolorów",
    boiler_supply: "Zasilanie kotła", boiler_return: "Powrót kotła", supply: "Zasilanie CO (za zaworem 4D)",
    return: "Powrót CO", hotwater: "Temperatura CWU", hotwater_valve: "Zawór CWU", heater: "Grzałka CWU",
    room: "Temperatura w domu", outdoor: "Temperatura zewnętrzna", valve: "Zawór 4D – pozycja %",
    thermostat: "Termostat (temperatura zadana)", pump_on: "Pompa CO włącza się od (°C zasilania kotła)",
    pump_hysteresis: "Histereza pompy (°C)", burning_on: "Pali się od (°C zasilania kotła)",
    burning_hysteresis: "Histereza palenia (°C)", min_temp: "Kolor: minimum (°C)", max_temp: "Kolor: maksimum (°C)",
    valve_step: "Krok zaworu 4D (%)",
  },
  en: {
    title: "Title", language: "Language", entities: "Entities", logic: "Pump and fire (no entities)", scale: "Colour scale",
    boiler_supply: "Boiler supply", boiler_return: "Boiler return", supply: "Heating supply (after the 4-way valve)",
    return: "Heating return", hotwater: "Hot water temperature", hotwater_valve: "Hot water valve",
    heater: "Hot water heater", room: "Indoor temperature", outdoor: "Outdoor temperature",
    valve: "4-way valve – position %", thermostat: "Thermostat (setpoint)",
    pump_on: "Heating pump starts at (°C boiler supply)", pump_hysteresis: "Pump hysteresis (°C)",
    burning_on: "Burning from (°C boiler supply)", burning_hysteresis: "Burning hysteresis (°C)",
    min_temp: "Colour: minimum (°C)", max_temp: "Colour: maximum (°C)", valve_step: "4-way valve step (%)",
  },
};

const ENTITY_KEYS = ["boiler_supply", "boiler_return", "supply", "return", "hotwater", "hotwater_valve", "heater",
  "room", "outdoor", "valve", "thermostat"];

const DEFAULTS = {
  pump_on: 40, pump_hysteresis: 2, burning_on: 45, burning_hysteresis: 2, min_temp: 20, max_temp: 80, valve_step: 5,
};

const ON_STATES = ["on", "open", "opening"];
const OFF = "var(--disabled-color, #c4c7cc)";
// Colour stops as fractions of min_temp..max_temp (20..80 °C: blue 20, cyan 35, green 45, yellow 55, orange 65, red 80)
const STOPS = [[0, [37, 99, 235]], [0.25, [6, 182, 212]], [0.4167, [34, 197, 94]], [0.5833, [234, 179, 8]],
  [0.75, [249, 115, 22]], [1, [220, 38, 38]]];

function tcol(t, min, max) {
  if (!Number.isFinite(t)) return OFF;
  const f = Math.min(1, Math.max(0, (t - min) / (max - min)));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, ca] = STOPS[i];
    const [b, cb] = STOPS[i + 1];
    if (f <= b) {
      const k = (f - a) / (b - a);
      const c = ca.map((x, j) => Math.round(x + (cb[j] - x) * k));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return "rgb(220,38,38)";
}

const PUMP_VANES = [0, 90, 180, 270]
  .map((r) => `<path d="M0,0 C5,-2 8,-7 8,-12 C3,-10 1,-5 0,0 Z" transform="rotate(${r})"/>`).join("");
const RAD_FINS = Array.from({ length: 9 }, (_, i) => `<rect x="${326 + 16 * i}" y="160" width="12" height="50" rx="4"/>`).join("");
const MINUS = '<circle r="9"/><path d="M-4,0 H4"/>';
const PLUS = '<circle r="9"/><path d="M-4,0 H4 M0,-4 V4"/>';

// 4D ports: N = boiler supply in, W = boiler return out, E = heating supply out (to the pump), S = heating return in.
const SVG = `
<svg viewBox="0 0 500 560" font-size="13">
  <defs>
    <linearGradient id="grad-rad" x1="0" y1="0" x2="0" y2="1">
      <stop id="grad-rad-in" offset="0"/><stop id="grad-rad-out" offset="1"/>
    </linearGradient>
    <linearGradient id="grad-tank" x1="0" y1="0" x2="0" y2="1">
      <stop id="grad-tank-top" offset="0"/><stop offset="1" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="grad-legend"></linearGradient>
  </defs>

  <g id="grp-outdoor" class="click" data-entity="outdoor">
    <circle cx="22" cy="24" r="11" fill="#fbbc04"/>
    <path d="M14,44 a9,9 0 0 1 5,-16 a12,12 0 0 1 22,3 a8,8 0 0 1 2,15 h-26 a7,7 0 0 1 -3,-2 z" fill="#fff" stroke="#9aa0a6" stroke-width="1.5"/>
    <text x="52" y="24" class="lbl" data-i18n="outdoor"></text>
    <text id="val-outdoor" x="52" y="43" class="val big18"></text>
  </g>

  <path id="pipe-boiler-supply" class="pipe" d="M40,330 V110 H190 V150"/>
  <path id="pipe-boiler-return" class="pipe" d="M170,170 H80 V330"/>
  <path id="pipe-supply" class="pipe" d="M210,170 H316"/>
  <path id="pipe-hw-supply" class="pipe" d="M300,170 V380 H360"/>
  <path id="pipe-hw-return" class="pipe" d="M430,436 H488"/>
  <path id="pipe-return" class="pipe" d="M472,200 H488 V520 H190 V190"/>
  <g id="flows">
    <path class="flow" d="M40,330 V110 H190 V150"/>
    <path class="flow" d="M210,170 H316"/>
    <path id="flow-hw" class="flow" d="M300,170 V380 H360"/>
    <path class="flow" d="M472,200 H488 V520 H190 V190"/>
    <path class="flow" d="M170,170 H80 V330"/>
  </g>

  <g id="boiler">
    <rect x="94" y="310" width="12" height="20" class="frame-fill"/>
    <g id="smoke" class="smoke">
      <circle cx="104" cy="301" r="3.5"/><circle cx="112" cy="291" r="4.5"/><circle cx="122" cy="280" r="5.5"/>
    </g>
    <rect x="10" y="330" width="100" height="180" rx="6" class="box" stroke-width="2"/>
    <rect x="20" y="340" width="80" height="40" rx="4" class="outline"/>
    <text x="60" y="357" text-anchor="middle" class="title" data-i18n="boiler"></text>
    <text id="st-burner" x="60" y="373" text-anchor="middle" class="lbl"></text>
    <rect x="20" y="388" width="80" height="80" rx="4" fill="#2a1a12" class="outline-stroke"/>
    <g transform="translate(60,464) scale(0.66) translate(-190,-392)">
      <g id="flame" class="flame">
        <path d="M190,392 c-28,0 -38,-22 -28,-44 c6,12 12,14 14,6 c-4,-18 6,-34 18,-44 c-2,16 10,22 16,34 c4,-6 4,-12 2,-18 c14,14 18,34 8,50 c-6,10 -16,16 -30,16 z" fill="#f97316"/>
        <path d="M190,392 c-14,0 -20,-12 -14,-24 c4,6 8,6 8,0 c0,-10 6,-16 12,-22 c0,10 8,14 10,24 c4,12 -4,22 -16,22 z" fill="#fde047"/>
      </g>
    </g>
    <rect x="20" y="476" width="80" height="26" rx="4" class="outline"/>
    <text x="60" y="493" text-anchor="middle" class="lbl" font-size="11" data-i18n="ash"></text>
  </g>
  <g class="click" data-entity="boiler_supply">
    <text x="115" y="84" class="lbl" text-anchor="middle" data-i18n="boiler_supply"></text>
    <text id="val-boiler-supply" x="115" y="101" text-anchor="middle" class="val"></text>
  </g>
  <g class="click" data-entity="boiler_return">
    <text x="90" y="238" class="lbl" data-i18n="boiler_return"></text>
    <text id="val-boiler-return" x="90" y="255" class="val"></text>
  </g>

  <text x="164" y="157" text-anchor="end" class="lbl" font-size="11" data-i18n="valve"></text>
  <g class="click" data-entity="valve" transform="translate(190,170)">
    <circle r="20" class="box" stroke-width="2"/>
    <g id="valve-vane"><path d="M-15,-15 L15,15" class="vane" stroke-width="4.5" stroke-linecap="round"/></g>
    <circle r="4" class="dot"/>
  </g>
  <g id="grp-valve" transform="translate(190,208)">
    <g class="btn" id="btn-valve-down" transform="translate(-36,0)">${MINUS}</g>
    <g class="click" data-entity="valve">
      <rect x="-23" y="-12" width="46" height="24" rx="12" id="valve-pill"/>
      <text id="val-valve" text-anchor="middle" y="5" fill="#fff" font-weight="bold" font-size="13"></text>
    </g>
    <g class="btn" id="btn-valve-up" transform="translate(36,0)">${PLUS}</g>
  </g>

  <text x="256" y="144" text-anchor="middle" class="lbl" data-i18n="pump"></text>
  <g transform="translate(256,170)">
    <circle r="16" fill="#fff" stroke="#5f6368" stroke-width="2"/>
    <g id="impeller">${PUMP_VANES}<circle r="2.5" fill="#fff" stroke="#5f6368"/></g>
  </g>
  <text id="st-pump" x="256" y="204" text-anchor="middle" class="val"></text>
  <g class="click" data-entity="supply">
    <text x="208" y="250" class="lbl" data-i18n="supply"></text>
    <text id="val-supply" x="208" y="267" class="val"></text>
  </g>
  <g class="click" data-entity="return">
    <text x="202" y="480" class="lbl" data-i18n="return"></text>
    <text id="val-return" x="202" y="497" class="val"></text>
  </g>

  <g id="house">
    <rect x="440" y="38" width="16" height="32" class="roof-dark"/>
    <rect x="436" y="34" width="24" height="6" rx="1.5" class="roof-dark"/>
    <path d="M302,82 L394,28 L486,82 Z" class="roof" stroke-width="2" stroke-linejoin="round"/>
    <path d="M332,74 L394,37 L456,74" fill="none" stroke="#9a3412" stroke-width="1.5" stroke-opacity=".6"/>
    <circle cx="394" cy="62" r="9" class="glass"/>
    <path d="M394,53 V71 M385,62 H403" class="outline-stroke" stroke-width="1.2"/>
    <rect x="316" y="82" width="156" height="138" rx="4" class="box" stroke-width="2"/>
    <rect x="320" y="154" width="148" height="62" rx="4" fill="url(#grad-rad)" fill-opacity=".25"/>
    <g fill="url(#grad-rad)">${RAD_FINS}</g>
    <text x="324" y="100" class="title" data-i18n="house"></text>
    <g class="click" data-entity="room">
      <text id="val-room" x="394" y="140" text-anchor="middle" class="val big22"></text>
    </g>
  </g>
  <g id="grp-thermostat" transform="translate(394,246)">
    <text text-anchor="middle" class="lbl" y="-14" font-size="11" data-i18n="thermostat"></text>
    <g class="btn" id="btn-sp-down" transform="translate(-44,0)">${MINUS}</g>
    <text id="val-setpoint" class="val click" data-entity="thermostat" text-anchor="middle" y="5"></text>
    <g class="btn" id="btn-sp-up" transform="translate(44,0)">${PLUS}</g>
  </g>

  <g class="click" data-entity="hotwater">
    <text x="395" y="300" text-anchor="middle" class="title" data-i18n="hotwater"></text>
    <rect x="360" y="310" width="70" height="170" rx="30" fill="url(#grad-tank)" fill-opacity=".3" class="outline-stroke" stroke-width="2"/>
    <text id="val-hotwater" x="395" y="350" text-anchor="middle" class="val"></text>
  </g>
  <path id="hw-coil" d="M360,380 H410 a7,7 0 0 1 0,14 H378 a7,7 0 0 0 0,14 H410 a7,7 0 0 1 0,14 H378 a7,7 0 0 0 0,14 H430"
        fill="none" stroke-width="4" stroke-linecap="round"/>
  <path id="heater" d="M371,460 l4,-6 l8,12 l8,-12 l8,12 l8,-12 l8,12 l4,-6" fill="none" stroke-width="3" stroke-linejoin="round"/>
  <g id="grp-hw-valve">
    <g class="click" data-entity="hotwater_valve" transform="translate(330,380)">
      <rect x="-7" y="-28" width="14" height="10" rx="2" class="box" stroke-width="1.5"/>
      <path d="M0,-18 V-12" class="outline-stroke" stroke-width="2"/>
      <circle r="12" class="box" stroke-width="2"/>
      <rect id="hw-valve-bore" x="-10" y="-4" width="20" height="8" rx="2"/>
    </g>
    <g id="btn-hw-valve" transform="translate(330,412)">
      <rect x="-21" y="-11" width="42" height="22" rx="11" id="hw-valve-pill"/>
      <text id="val-hw-valve" text-anchor="middle" y="5" fill="#fff" font-weight="bold" font-size="12"></text>
    </g>
    <text x="330" y="440" text-anchor="middle" class="lbl click" data-entity="hotwater_valve" font-size="11"><tspan data-i18n="hw_valve_1"></tspan><tspan x="330" dy="13" data-i18n="hw_valve_2"></tspan></text>
  </g>
  <g id="grp-heater" class="click" data-entity="heater" transform="translate(352,488)">
    <path id="heater-icon" d="M11,15H6L13,1V9H18L11,23V15Z" transform="scale(.8)"/>
    <text x="20" y="14" class="lbl" data-i18n="heater"></text>
    <text id="st-heater" x="68" y="14" class="val"></text>
  </g>

  <g transform="translate(200,550)">
    <rect width="130" height="7" rx="2" fill="url(#grad-legend)"/>
    <text id="lg-min" class="lbl" x="0" y="-5" font-size="11"></text>
    <text id="lg-mid" class="lbl" x="65" y="-5" text-anchor="middle" font-size="11"></text>
    <text id="lg-max" class="lbl" x="130" y="-5" text-anchor="end" font-size="11"></text>
    <rect x="150" width="26" height="7" rx="3.5" class="off-fill"/>
    <text class="lbl" x="182" y="7" font-size="11" data-i18n="no_flow"></text>
  </g>
</svg>`;

const STYLE = `
  :host { display: block; }
  ha-card { padding: 8px 8px 4px; overflow: hidden; }
  .card-title { padding: 4px 8px 0; font-size: 1.2em; color: var(--primary-text-color); }
  svg { width: 100%; height: auto; display: block; max-width: 560px; margin: 0 auto; }
  .pipe { fill: none; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; transition: stroke .4s; }
  .flow { stroke-dasharray: 2 18; stroke-width: 2.5; stroke: #fff; stroke-opacity: .55; fill: none; stroke-linecap: round;
          animation: flow 1.2s linear infinite; }
  @keyframes flow { to { stroke-dashoffset: -20; } }
  .lbl { fill: var(--secondary-text-color, #5f6368); font-size: 12px; }
  .val { fill: var(--primary-text-color, #202124); font-size: 14px; font-weight: bold; }
  .big18 { font-size: 18px; }
  .big22 { font-size: 22px; }
  .title { fill: var(--primary-text-color, #202124); font-size: 14px; font-weight: bold; }
  .box { fill: var(--card-background-color, #fff); stroke: var(--secondary-text-color, #5f6368); }
  .outline { fill: none; stroke: var(--secondary-text-color, #5f6368); stroke-width: 1.5; }
  .outline-stroke { stroke: var(--secondary-text-color, #5f6368); }
  .frame-fill { fill: var(--secondary-text-color, #5f6368); }
  .vane { stroke: var(--primary-text-color, #202124); }
  .dot { fill: var(--primary-text-color, #202124); }
  .smoke { fill: var(--secondary-text-color, #5f6368); fill-opacity: .35; }
  .roof { fill: #c2410c; stroke: var(--secondary-text-color, #5f6368); }
  .roof-dark { fill: #9a3412; stroke: var(--secondary-text-color, #5f6368); stroke-width: 1.5; }
  .glass { fill: #bfdbfe; stroke: var(--secondary-text-color, #5f6368); stroke-width: 1.5; }
  .off-fill { fill: ${OFF}; }
  .click { cursor: pointer; }
  .click:hover { opacity: .75; }
  .btn { cursor: pointer; }
  .btn circle { fill: var(--card-background-color, #fff); stroke: var(--primary-color, #1a73e8); stroke-width: 1.5; }
  .btn path { stroke: var(--primary-color, #1a73e8); stroke-width: 2.2; stroke-linecap: round; fill: none; }
  .btn:hover circle { fill: var(--primary-color, #1a73e8); fill-opacity: .15; }
  .hidden { display: none; }
  .spin { transform-box: fill-box; transform-origin: center; animation: spin 1.6s steps(48) infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .flame { transform-box: fill-box; transform-origin: 50% 100%; animation: flick .9s ease-in-out infinite alternate; }
  @keyframes flick { from { transform: scale(1, .92); } to { transform: scale(.94, 1.06); } }
  @media (prefers-reduced-motion: reduce) { .spin, .flame, .flow { animation: none; } }
`;

// <ha-form> is lazy-loaded by HA; opening a built-in card editor that uses it makes sure it is defined.
async function loadHaForm() {
  if (customElements.get("ha-form") || !window.loadCardHelpers) return;
  const helpers = await window.loadCardHelpers();
  const card = await helpers.createCardElement({ type: "entities", entities: [] });
  if (card && card.constructor.getConfigElement) await card.constructor.getConfigElement();
}

function pickLang(config, hass) {
  if (config.language) return config.language;
  const l = (hass && (hass.locale?.language || hass.language)) || "en";
  return l.startsWith("pl") ? "pl" : "en";
}

class FurnaceCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("furnace-card-editor");
  }

  static getStubConfig() {
    return { entities: {} };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.entities !== undefined && (typeof config.entities !== "object" || config.entities === null))
      throw new Error("entities: must be a map of key: entity_id");
    const unknown = Object.keys(config.entities || {}).filter((k) => !ENTITY_KEYS.includes(k));
    if (unknown.length) throw new Error(`Unknown entity keys: ${unknown.join(", ")}`);
    if (config.language && !I18N[config.language]) throw new Error("language: must be pl or en");
    for (const k of Object.keys(DEFAULTS))
      if (config[k] !== undefined && !Number.isFinite(Number(config[k]))) throw new Error(`${k}: must be a number`);
    const c = { ...DEFAULTS, ...config, entities: { ...(config.entities || {}) } };
    for (const k of Object.keys(DEFAULTS)) c[k] = Number(c[k]);
    if (c.max_temp <= c.min_temp) throw new Error("max_temp must be greater than min_temp");
    this._config = c;
    this._pumpOn = undefined;
    this._burning = undefined;
    if (this._root) this._build();
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._root) this._build();
    else if (this._lang !== pickLang(this._config, hass)) this._build();
    this._update();
  }

  _build() {
    if (!this._root) this._root = this.attachShadow({ mode: "open" });
    this._lang = pickLang(this._config, this._hass);
    const t = I18N[this._lang];
    const title = this._config.title ?? t.title;
    this._root.innerHTML = `<style>${STYLE}</style><ha-card>${title ? `<div class="card-title"></div>` : ""}${SVG}</ha-card>`;
    if (title) this._root.querySelector(".card-title").textContent = title;
    this._root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t[el.dataset.i18n]; });
    const $ = (id) => this._root.getElementById(id);
    this.$ = $;

    const { min_temp: min, max_temp: max } = this._config;
    $("grad-legend").innerHTML = STOPS.map(([f]) =>
      `<stop offset="${f}" stop-color="${tcol(min + f * (max - min), min, max)}"/>`).join("");
    $("lg-min").textContent = `${min}°`;
    $("lg-mid").textContent = `${Math.round((min + max) / 2)}°`;
    $("lg-max").textContent = `${max}°`;

    this._root.querySelectorAll("[data-entity]").forEach((el) => el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const id = this._entityFor(el.dataset.entity);
      if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    }));
    $("btn-valve-down").addEventListener("click", () => this._stepValve(-1));
    $("btn-valve-up").addEventListener("click", () => this._stepValve(1));
    $("btn-sp-down").addEventListener("click", () => this._stepSetpoint(-1));
    $("btn-sp-up").addEventListener("click", () => this._stepSetpoint(1));
    $("btn-hw-valve").addEventListener("click", () => this._toggleHwValve());
    this._pendingValve = this._pendingSp = undefined;
    if (this._hass) this._update();
  }

  // The indoor temperature falls back to a climate thermostat's current temperature.
  _entityFor(key) {
    const e = this._config.entities;
    if (key === "room" && !e.room && this._domain(e.thermostat) === "climate") return e.thermostat;
    return e[key];
  }

  _domain(id) {
    return id ? id.split(".")[0] : undefined;
  }

  _state(key) {
    const id = this._config.entities[key];
    return id && this._hass ? this._hass.states[id] : undefined;
  }

  _num(key) {
    const st = this._state(key);
    if (!st) return NaN;
    const v = parseFloat(st.state);
    return Number.isFinite(v) ? v : NaN;
  }

  _isOn(key) {
    const st = this._state(key);
    return st ? ON_STATES.includes(st.state) : undefined;
  }

  _fmt(v, digits = 1) {
    if (!Number.isFinite(v)) return "—";
    return `${new Intl.NumberFormat(this._lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v)} °C`;
  }

  // On at `on` °C, off below `on - hysteresis`; in between keep the last state.
  _threshold(prev, t, on, hyst) {
    if (!Number.isFinite(t)) return false;
    if (t >= on) return true;
    if (t < on - hyst) return false;
    return prev ?? false;
  }

  _valvePos() {
    const st = this._state("valve");
    if (!st) return NaN;
    const d = this._domain(st.entity_id);
    const v = d === "cover" || d === "valve" ? Number(st.attributes.current_position) : parseFloat(st.state);
    return Number.isFinite(v) ? v : NaN;
  }

  _setpoint() {
    const st = this._state("thermostat");
    if (!st) return NaN;
    const v = this._domain(st.entity_id) === "climate" ? Number(st.attributes.temperature) : parseFloat(st.state);
    return Number.isFinite(v) ? v : NaN;
  }

  _update() {
    if (!this._hass || !this._root) return;
    const $ = this.$;
    const c = this._config;
    const e = c.entities;
    const col = (t) => tcol(t, c.min_temp, c.max_temp);
    const t = this._lang && I18N[this._lang];

    const bs = this._num("boiler_supply");
    const br = this._num("boiler_return");
    const sup = this._num("supply");
    const ret = this._num("return");
    const hw = this._num("hotwater");
    this._pumpOn = this._threshold(this._pumpOn, bs, c.pump_on, c.pump_hysteresis);
    this._burning = this._threshold(this._burning, bs, c.burning_on, c.burning_hysteresis);
    const pump = this._pumpOn;
    const hwOpen = e.hotwater_valve ? this._isOn("hotwater_valve") === true : true;
    const hwFlow = pump && hwOpen;

    // pipes
    const pipe = (id, temp, active) => { $(id).style.stroke = active && Number.isFinite(temp) ? col(temp) : OFF; };
    pipe("pipe-boiler-supply", bs, pump);
    pipe("pipe-boiler-return", br, pump);
    pipe("pipe-supply", sup, pump);
    pipe("pipe-hw-supply", sup, hwFlow);
    pipe("pipe-hw-return", ret, hwFlow);
    pipe("pipe-return", ret, pump);
    $("hw-coil").style.stroke = hwFlow && Number.isFinite(sup) ? col(sup) : OFF;
    $("flows").style.display = pump ? "" : "none";
    $("flow-hw").style.display = hwFlow ? "" : "none";
    $("grad-rad-in").setAttribute("stop-color", pump && Number.isFinite(sup) ? col(sup) : OFF);
    $("grad-rad-out").setAttribute("stop-color", pump && Number.isFinite(ret) ? col(ret) : OFF);
    $("grad-tank-top").setAttribute("stop-color", Number.isFinite(hw) ? col(hw) : OFF);

    // values
    const val = (id, v, colour = true) => {
      $(id).textContent = this._fmt(v);
      $(id).style.fill = colour && Number.isFinite(v) ? col(v) : "";
    };
    val("val-boiler-supply", bs);
    val("val-boiler-return", br);
    val("val-supply", sup);
    val("val-return", ret);
    val("val-hotwater", hw, false);

    const out = this._num("outdoor");
    $("grp-outdoor").classList.toggle("hidden", !e.outdoor);
    $("val-outdoor").textContent = this._fmt(out, 0).replace(/^-0 /, "0 ");
    $("val-outdoor").style.fill = out < 0 ? "#3b82f6" : "";

    let room = this._num("room");
    if (!e.room && this._domain(e.thermostat) === "climate")
      room = Number(this._state("thermostat")?.attributes.current_temperature);
    $("val-room").textContent = this._fmt(room);

    // pump and fire
    $("impeller").classList.toggle("spin", pump);
    $("impeller").setAttribute("fill", pump ? "#1a73e8" : "#9aa0a6");
    $("st-pump").textContent = pump ? t.running : t.stopped;
    const burning = this._burning;
    $("flame").style.display = burning ? "" : "none";
    $("smoke").style.display = burning ? "" : "none";
    $("st-burner").textContent = burning ? t.burning : t.out;

    // 4D valve: 0 % = boiler cut off (vane NE-SW), 100 % = boiler fully in (vane NW-SE)
    const pos = this._pendingValve ?? this._valvePos();
    $("valve-vane").setAttribute("transform", `rotate(${90 * (1 - (Number.isFinite(pos) ? pos : 50) / 100)})`);
    $("grp-valve").classList.toggle("hidden", !e.valve);
    $("val-valve").textContent = Number.isFinite(pos) ? `${Math.round(pos)}%` : "—";
    $("valve-pill").setAttribute("fill", pos > 0 ? "#188038" : "#5f6368");
    const valveSettable = ["number", "input_number", "cover", "valve"].includes(this._domain(e.valve));
    $("btn-valve-down").classList.toggle("hidden", !valveSettable);
    $("btn-valve-up").classList.toggle("hidden", !valveSettable);

    // thermostat
    const sp = this._pendingSp ?? this._setpoint();
    $("grp-thermostat").classList.toggle("hidden", !e.thermostat);
    $("val-setpoint").textContent = this._fmt(sp);

    // hot water valve: bore along the pipe = open, across = closed
    $("grp-hw-valve").classList.toggle("hidden", !e.hotwater_valve);
    $("hw-valve-bore").setAttribute("transform", hwOpen ? "" : "rotate(90)");
    $("hw-valve-bore").setAttribute("fill", hwOpen ? "#188038" : "#5f6368");
    $("hw-valve-pill").setAttribute("fill", hwOpen ? "#188038" : "#5f6368");
    $("val-hw-valve").textContent = hwOpen ? "ON" : "OFF";
    $("btn-hw-valve").setAttribute("class", this._hwToggleable() ? "btn" : "click");

    // electric heater
    const heater = this._isOn("heater") === true;
    $("grp-heater").classList.toggle("hidden", !e.heater);
    $("heater").style.stroke = heater ? "#dc2626" : OFF;
    $("heater-icon").style.fill = heater ? "#fbbc04" : OFF;
    $("st-heater").textContent = heater ? "ON" : "OFF";
  }

  _hwToggleable() {
    return ["switch", "input_boolean", "valve"].includes(this._domain(this._config.entities.hotwater_valve));
  }

  _toggleHwValve() {
    const id = this._config.entities.hotwater_valve;
    if (!id) return;
    if (!this._hwToggleable()) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
      return;
    }
    const d = this._domain(id);
    this._hass.callService(d === "valve" ? "valve" : d, "toggle", { entity_id: id });
  }

  // Quick repeated clicks are sent as one call.
  _stepValve(dir) {
    const st = this._state("valve");
    if (!st) return;
    const d = this._domain(st.entity_id);
    const cur = this._pendingValve ?? this._valvePos();
    const min = Number(st.attributes.min ?? 0);
    const max = Number(st.attributes.max ?? 100);
    const v = Math.min(max, Math.max(min, (Number.isFinite(cur) ? cur : 0) + dir * this._config.valve_step));
    this._pendingValve = v;
    this._update();
    clearTimeout(this._valveTimer);
    this._valveTimer = setTimeout(() => {
      if (d === "cover") this._hass.callService("cover", "set_cover_position", { entity_id: st.entity_id, position: v });
      else if (d === "valve") this._hass.callService("valve", "set_valve_position", { entity_id: st.entity_id, position: v });
      else this._hass.callService(d, "set_value", { entity_id: st.entity_id, value: v });
      setTimeout(() => { this._pendingValve = undefined; this._update(); }, 1500);
    }, 700);
  }

  _stepSetpoint(dir) {
    const st = this._state("thermostat");
    if (!st) return;
    const climate = this._domain(st.entity_id) === "climate";
    const step = Number(climate ? st.attributes.target_temp_step : st.attributes.step) || 0.5;
    const min = Number(climate ? st.attributes.min_temp : st.attributes.min);
    const max = Number(climate ? st.attributes.max_temp : st.attributes.max);
    const cur = this._pendingSp ?? this._setpoint();
    if (!Number.isFinite(cur)) return;
    let v = Math.round((cur + dir * step) / step) * step;
    if (Number.isFinite(min)) v = Math.max(min, v);
    if (Number.isFinite(max)) v = Math.min(max, v);
    this._pendingSp = Number(v.toFixed(2));
    this._update();
    clearTimeout(this._spTimer);
    this._spTimer = setTimeout(() => {
      const value = this._pendingSp;
      if (climate) this._hass.callService("climate", "set_temperature", { entity_id: st.entity_id, temperature: value });
      else this._hass.callService(this._domain(st.entity_id), "set_value", { entity_id: st.entity_id, value });
      setTimeout(() => { this._pendingSp = undefined; this._update(); }, 1500);
    }, 700);
  }
}

class FurnaceCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    loadHaForm().then(() => this._render());
  }

  _schema() {
    const ent = (name, domain) => ({ name, selector: { entity: { domain } } });
    const num = (name, min, max, step) => ({ name, selector: { number: { min, max, step, mode: "box" } } });
    return [
      { name: "title", selector: { text: {} } },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "pl", label: "Polski" }, { value: "en", label: "English" }] } } },
      {
        name: "entities", type: "expandable", expanded: true, schema: [
          ent("boiler_supply", "sensor"), ent("boiler_return", "sensor"), ent("supply", "sensor"), ent("return", "sensor"),
          ent("hotwater", "sensor"), ent("hotwater_valve", ["switch", "binary_sensor", "input_boolean", "valve"]),
          ent("heater", ["binary_sensor", "switch", "input_boolean"]), ent("room", "sensor"), ent("outdoor", "sensor"),
          ent("valve", ["number", "input_number", "sensor", "cover", "valve"]),
          ent("thermostat", ["climate", "number", "input_number"]),
        ],
      },
      {
        name: "logic", type: "expandable", flatten: true, schema: [
          num("pump_on", 0, 100, 0.5), num("pump_hysteresis", 0, 20, 0.5),
          num("burning_on", 0, 100, 0.5), num("burning_hysteresis", 0, 20, 0.5),
        ],
      },
      {
        name: "scale", type: "expandable", flatten: true, schema: [
          num("min_temp", -20, 100, 1), num("max_temp", 0, 120, 1), num("valve_step", 1, 50, 1),
        ],
      },
    ];
  }

  _render() {
    if (!this._config || !customElements.get("ha-form")) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        const config = { ...ev.detail.value };
        // keep the YAML short: drop empty values and numbers equal to their defaults
        for (const k of Object.keys(config))
          if (config[k] === "" || config[k] === undefined || DEFAULTS[k] === Number(config[k])) delete config[k];
        if (config.entities) {
          config.entities = { ...config.entities };
          for (const k of Object.keys(config.entities)) if (!config.entities[k]) delete config.entities[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const lang = pickLang(this._config, this._hass);
    const labels = EDITOR_I18N[lang];
    this._form.hass = this._hass;
    this._form.data = { ...DEFAULTS, ...this._config, entities: { ...(this._config.entities || {}) } };
    this._form.schema = this._schema();
    this._form.computeLabel = (s) => labels[s.name] ?? s.name;
  }
}

customElements.define("furnace-card", FurnaceCard);
customElements.define("furnace-card-editor", FurnaceCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "furnace-card",
  name: "Furnace / boiler room",
  description: "Boiler with a 4-way valve, heating pump, radiators and hot water tank; pipes coloured by temperature.",
  preview: false,
});
console.info(`%c FURNACE-CARD %c ${CARD_VERSION} `, "background:#c2410c;color:#fff", "");
