// Furnace card: a Home Assistant Lovelace card that draws a boiler (CO) with a 4-way mixing valve, the heating pump on
// the hot side of the valve, the house radiators and the hot water tank (CWU) with its zone valve and electric heater.
// Pipes are coloured by temperature. The pump and the fire have no entities: they follow the boiler supply temperature
// with thresholds from the config.
const CARD_VERSION = "1.2.0";

const I18N = {
  pl: {
    title: "Kotłownia", outdoor: "Zewnętrzna", boiler_supply: "zasilanie kotła", boiler_return: "powrót kotła",
    supply: "zasilanie CO", return: "powrót CO", valve: "zawór 4D", pump: "Pompa CO", flue: "spaliny", fan: "wentylator", battery: "magazyn energii",
    boiler: "Kocioł CO", burning: "pali się", out: "wygaszony",
    thermostat: "termostat", hotwater: "CWU", hw_valve_1: "zawór", hw_valve_2: "CWU", heater: "grzałka", pv1: "Falownik 1", pv2: "Falownik 2", pv_total: "razem", grid: "Sieć",
    no_flow: "brak przepływu",
  },
  en: {
    title: "Boiler room", outdoor: "Outdoor", boiler_supply: "boiler supply", boiler_return: "boiler return",
    supply: "heating supply", return: "heating return", valve: "4-way valve", pump: "Heating pump", flue: "flue gas", fan: "fan", battery: "battery",
    boiler: "Boiler", burning: "burning", out: "out",
    thermostat: "thermostat", hotwater: "DHW", hw_valve_1: "DHW", hw_valve_2: "valve", heater: "heater", pv1: "Inverter 1", pv2: "Inverter 2", pv_total: "total", grid: "Grid",
    no_flow: "no flow",
  },
};

const EDITOR_I18N = {
  pl: {
    title: "Tytuł", layout: "Układ (auto: poziomy od 760 px)", language: "Język", entities: "Encje", logic: "Pompa i palenie (z temperatury)", scale: "Skala kolorów",
    boiler_supply: "Zasilanie kotła", boiler_return: "Powrót kotła", supply: "Zasilanie CO (za zaworem 4D)",
    return: "Powrót CO", hotwater: "Temperatura CWU", hotwater_valve: "Zawór CWU", heater: "Grzałka CWU",
    room: "Temperatura w domu", outdoor: "Temperatura zewnętrzna", grid: "Sieć – moc (+ pobór)", grid_invert: "Odwróć kierunek sieci",
    weather: "Pogoda (ikona)", pv1: "Falownik 1 – moc", pv2: "Falownik 2 – moc",
    pv: "Fotowoltaika", pv1_name: "Falownik 1 – podpis", pv2_name: "Falownik 2 – podpis",
    pv1_max: "Falownik 1 – moc maks. (kW)", pv2_max: "Falownik 2 – moc maks. (kW)", valve: "Zawór 4D – pozycja %",
    thermostat: "Termostat (temperatura zadana)", pump_on: "Pompa CO włącza się od (°C zasilania kotła)",
    pump_hysteresis: "Histereza pompy (°C)", burning_on: "Pali się od (°C zasilania kotła)",
    burning_hysteresis: "Histereza palenia (°C)", min_temp: "Kolor: minimum (°C)", max_temp: "Kolor: maksimum (°C)",
    valve_step: "Krok zaworu 4D (%)", pump: "Pompa CO (puste: z temperatury zasilania kotła)", flue: "Temperatura spalin",
    burner: "Stan kotła (puste: z temperatury zasilania kotła)", burner_states: "Stany kotła oznaczające palenie",
    fan: "Wentylator (%)", battery_soc: "Magazyn energii – naładowanie %", battery_power: "Magazyn energii – moc (+ ładowanie)",
    battery_invert: "Odwróć kierunek magazynu",
  },
  en: {
    title: "Title", layout: "Layout (auto: landscape from 760 px)", language: "Language", entities: "Entities", logic: "Pump and fire (from temperature)", scale: "Colour scale",
    boiler_supply: "Boiler supply", boiler_return: "Boiler return", supply: "Heating supply (after the 4-way valve)",
    return: "Heating return", hotwater: "Hot water temperature", hotwater_valve: "Hot water valve",
    heater: "Hot water heater", room: "Indoor temperature", outdoor: "Outdoor temperature", grid: "Grid power (+ import)", grid_invert: "Invert grid direction",
    weather: "Weather (icon)",
    pv1: "Inverter 1 – power", pv2: "Inverter 2 – power", pv: "Photovoltaics", pv1_name: "Inverter 1 – label",
    pv1_max: "Inverter 1 – max power (kW)", pv2_max: "Inverter 2 – max power (kW)",
    pv2_name: "Inverter 2 – label",
    valve: "4-way valve – position %", thermostat: "Thermostat (setpoint)",
    pump_on: "Heating pump starts at (°C boiler supply)", pump_hysteresis: "Pump hysteresis (°C)",
    burning_on: "Burning from (°C boiler supply)", burning_hysteresis: "Burning hysteresis (°C)",
    min_temp: "Colour: minimum (°C)", max_temp: "Colour: maximum (°C)", valve_step: "4-way valve step (%)",
    pump: "Heating pump (empty: from the boiler supply temperature)", flue: "Flue gas temperature",
    burner: "Boiler state (empty: from the boiler supply temperature)", burner_states: "Boiler states that mean burning",
    fan: "Fan (%)", battery_soc: "Battery – charge %", battery_power: "Battery – power (+ charging)",
    battery_invert: "Invert battery direction",
  },
};

const ENTITY_KEYS = ["grid", "weather", "pv1", "pv2", "boiler_supply", "boiler_return", "supply", "return", "hotwater", "hotwater_valve", "heater",
  "room", "outdoor", "valve", "thermostat", "pump", "flue", "burner", "fan", "battery_soc", "battery_power"];

const DEFAULTS = {
  pump_on: 40, pump_hysteresis: 2, burning_on: 45, burning_hysteresis: 2, min_temp: 20, max_temp: 80, valve_step: 5,
  pv1_max: 10, pv2_max: 10,
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
const SUN_RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const p = (r) => `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  return `<path d="M${p(12)} L${p(16)}"/>`;
}).join("");
// PV field on the left roof slope: top edge follows the slope 3 px below it, bottom at y=79, x 330..382 (left of the
// gable window). Module grid: 4 columns, rows parallel to the slope, clipped to the field.
const PV_FIELD = "330,69.5 382,39 382,79 330,79";
const PV_GRID = [343, 356, 369].map((x) => `M${x},30 V80`).join(" ") + " " +
  [1, 2, 3, 4].map((k) => `M330,${69.5 + 10 * k} L382,${39 + 10 * k}`).join(" ");
// Weather icons (50 x 60 box) for the HA weather conditions.
const WX_CLOUD = "M14,44 a9,9 0 0 1 5,-16 a12,12 0 0 1 22,3 a8,8 0 0 1 2,15 h-26 a7,7 0 0 1 -3,-2 z";
const wxSun = (x, y, r) => `<g fill="#fbbc04" stroke="#fbbc04" stroke-width="2" stroke-linecap="round">` +
  Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const p = (d) => `${(x + d * Math.cos(a)).toFixed(1)},${(y + d * Math.sin(a)).toFixed(1)}`;
    return `<path d="M${p(r + 3)} L${p(r + 7)}"/>`;
  }).join("") + `<circle cx="${x}" cy="${y}" r="${r}" stroke="none"/></g>`;
const wxMoon = (x, y) => `<path d="M${x + 4},${y - 11} A11,11 0 1 0 ${x + 11},${y + 6} A9,9 0 0 1 ${x + 4},${y - 11} Z" fill="#fde68a" stroke="#d6b44a" stroke-width="1"/>`;
const wxCloud = (fill = "#fff", dx = 0, dy = 0) =>
  `<path d="${WX_CLOUD}" transform="translate(${dx},${dy})" fill="${fill}" stroke="#9aa0a6" stroke-width="1.5"/>`;
const wxDrops = (n) => [18, 28, 38, 23, 33].slice(0, n).map((x, i) =>
  `<path d="M${x},${i < 3 ? 50 : 55} l-3,6" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round"/>`).join("");
const wxSnow = [17, 27, 37].map((x, i) => `<circle cx="${x}" cy="${i === 1 ? 56 : 53}" r="2" fill="#60a5fa"/>`).join("");
const WX_BOLT = '<path d="M28,38 L21,51 H27 L24,60 L35,45 H29 L32,38 Z" fill="#fbbc04" stroke="#b45309" stroke-width=".8"/>';
const WX_FOG = '<path d="M10,51 H44 M14,57 H40" stroke="#9aa0a6" stroke-width="2.5" stroke-linecap="round"/>';
const WX_WIND = '<path d="M6,22 H30 a5,5 0 1 0 -5,-5 M6,30 H40 a5,5 0 1 1 -5,5 M10,38 H26" fill="none" stroke="#9aa0a6" stroke-width="2.5" stroke-linecap="round"/>';
function weatherIcon(cond, night) {
  const behind = night ? wxMoon(22, 22) : wxSun(22, 24, 9);
  const grey = wxCloud("#cfd4da", 8, -9);
  switch (cond) {
    case "sunny": return wxSun(26, 28, 11);
    case "clear-night": return wxMoon(26, 28);
    case "partlycloudy": return behind + wxCloud();
    case "cloudy": return grey + wxCloud();
    case "rainy": return grey + wxCloud() + wxDrops(3);
    case "pouring": return grey + wxCloud("#b8bec6") + wxDrops(5);
    case "snowy": return grey + wxCloud() + wxSnow;
    case "snowy-rainy": return grey + wxCloud() + wxDrops(2) + wxSnow;
    case "hail": return grey + wxCloud() + wxSnow.replace(/#60a5fa/g, "#cbd5e1");
    case "lightning": return grey + wxCloud("#b8bec6") + WX_BOLT;
    case "lightning-rainy": return grey + wxCloud("#b8bec6") + wxDrops(2) + WX_BOLT;
    case "fog": return wxCloud() + WX_FOG;
    case "windy": return WX_WIND;
    case "windy-variant": return wxCloud("#fff", 4, -6) + WX_WIND.replace("M6,22", "M6,44").replace("M6,30", "M6,50").replace("M10,38", "M10,56");
    default: return behind + wxCloud();
  }
}

const PV_COLORS = ["#c026d3", "#4f8ff7"];
const MINUS = '<circle r="18"/><path d="M-8,0 H8"/>';
const PLUS = '<circle r="18"/><path d="M-8,0 H8 M0,-8 V8"/>';
// Material Design Icons (mdi:thermostat, mdi:flash), 24×24
const MDI_THERMOSTAT = "M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z";
const MDI_FLASH = "M7,2V13H10V22L17,10H13L17,2H7Z";
const MDI_FAN = "M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z";
// states of a text boiler entity that mean "burning" when burner_states is not set
const BURNER_STATES = ["on", "true", "praca", "pali się", "burning", "heating", "work", "running"];

// Coil inside the horizontal tank: vertical loops over the whole length, in on the left, out on the right.
const COIL = (() => {
  let d = "M336,330 H346";
  for (let i = 0; i < 11; i++) {
    const down = i % 2 === 0;
    d += down ? " V358" : " V330";
    if (i < 10) d += down ? " a5.5,5.5 0 0 0 11,0" : " a5.5,5.5 0 0 1 11,0";
  }
  return `${d} H476`;
})();

// Two arrangements of the same drawing (same element ids, so _update() does not care which one is shown):
//   portrait  – 500 wide: boiler bottom left, house top right, hot water tank under the house
//   landscape – 680 wide: boiler left next to the 4-way valve and the pump, house with the tank under it
// Groups (boiler, house with PV, tank) are drawn once in portrait coordinates and moved with `translate`.
// 4D ports: N = boiler supply in, W = boiler return out, E = heating supply out (to the pump), S = heating return in.
const LAYOUTS = {
  portrait: {
    viewBox: "0 -80 500 595", boiler: [0, 0], house: [0, 0], tank: [0, 0],
    pipes: {
      boiler_supply: "M40,330 V110 H190 V150", boiler_return: "M170,170 H80 V330", supply: "M210,170 H316",
      hw_supply: "M300,170 V330 H336", hw_return: "M476,358 H488", ret: "M472,200 H488 V450 H190 V190",
    },
    valBoilerSupply: [115, 101], valBoilerReturn: [125, 159], valve: [190, 170],
    valvePill: [190, 220], pump: [264, 170], valSupply: [213, 201], valReturn: [202, 425],
    hwValve: [300, 288, -90], hwPill: [240, 288], hwLbl: [240, 314], legend: [184, 494],
  },
  landscape: {
    viewBox: "0 -104 680 560", boiler: [14, -110], house: [174, -20], tank: [174, -20],
    pipes: {
      boiler_supply: "M54,220 V90 H280 V130", boiler_return: "M260,150 H94 V220", supply: "M300,150 H490",
      hw_supply: "M450,150 V310 H510", hw_return: "M650,338 H662", ret: "M646,180 H662 V420 H280 V170",
    },
    valBoilerSupply: [167, 81], valBoilerReturn: [177, 139], valve: [280, 150],
    valvePill: [280, 192], pump: [380, 150], valSupply: [303, 141], valReturn: [294, 397],
    hwValve: [450, 268, -90], hwPill: [390, 268], hwLbl: [390, 294], legend: [330, 444],
  },
};

function buildSvg(L) {
  const t = ([x, y]) => `translate(${x},${y})`;
  const P = L.pipes;
  return `
<svg viewBox="${L.viewBox}" font-size="13">
  <defs>
    <linearGradient id="grad-rad" x1="0" y1="0" x2="0" y2="1">
      <stop id="grad-rad-in" offset="0"/><stop id="grad-rad-out" offset="1"/>
    </linearGradient>
    <linearGradient id="grad-tank" x1="0" y1="0" x2="1" y2="0">
      <stop id="grad-tank-in" offset="0"/><stop id="grad-tank-out" offset="1"/>
    </linearGradient>
    <linearGradient id="grad-legend"></linearGradient>
    <linearGradient id="grad-divider" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" class="divider-stop" stop-opacity="0"/><stop offset=".5" class="divider-stop" stop-opacity=".55"/>
      <stop offset="1" class="divider-stop" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <g id="grp-outdoor" transform="translate(0,-66)">
    <g id="wx-icon" class="click" data-entity="weather"></g>
    <g class="click" data-entity="outdoor">
      <text x="64" y="20" class="lbl" data-i18n="outdoor"></text>
      <text id="val-outdoor" x="64" y="48" class="val big28"></text>
    </g>
  </g>

  <path id="pipe-boiler-supply" class="pipe" d="${P.boiler_supply}"/>
  <path id="pipe-boiler-return" class="pipe" d="${P.boiler_return}"/>
  <path id="pipe-supply" class="pipe" d="${P.supply}"/>
  <path id="pipe-hw-supply" class="pipe" d="${P.hw_supply}"/>
  <path id="pipe-hw-return" class="pipe" d="${P.hw_return}"/>
  <path id="pipe-return" class="pipe" d="${P.ret}"/>
  <g id="flows">
    <path class="flow" d="${P.boiler_supply}"/>
    <path class="flow" d="${P.supply}"/>
    <path id="flow-hw" class="flow" d="${P.hw_supply}"/>
    <path class="flow" d="${P.ret}"/>
    <path class="flow" d="${P.boiler_return}"/>
  </g>

  <g id="boiler" transform="${t(L.boiler)}">
    <rect x="94" y="310" width="12" height="20" class="frame-fill"/>
    <g id="smoke" class="smoke">
      <circle cx="104" cy="302" r="3"/><circle cx="111" cy="295" r="4"/><circle cx="120" cy="287" r="5"/>
    </g>
    <!-- flue gas temperature, above the smoke -->
    <g id="grp-flue" class="click" data-entity="flue"><title data-i18n="flue"></title>
      <text id="val-flue" x="122" y="277" text-anchor="middle" class="val flue"></text>
    </g>
    <rect x="6" y="330" width="108" height="180" rx="6" class="box steel" stroke-width="2"/>
    <rect x="14" y="340" width="92" height="42" rx="4" class="outline panel"/>
    <text x="60" y="358" text-anchor="middle" class="title" data-i18n="boiler"></text>
    <text id="st-burner" x="60" y="375" text-anchor="middle" class="lbl"></text>
    <rect x="14" y="390" width="92" height="78" rx="4" fill="#2a1a12" class="outline-stroke"/>
    <g transform="translate(60,464) scale(0.66) translate(-190,-392)">
      <g id="flame" class="flame">
        <path d="M190,392 c-28,0 -38,-22 -28,-44 c6,12 12,14 14,6 c-4,-18 6,-34 18,-44 c-2,16 10,22 16,34 c4,-6 4,-12 2,-18 c14,14 18,34 8,50 c-6,10 -16,16 -30,16 z" fill="#f97316"/>
        <path d="M190,392 c-14,0 -20,-12 -14,-24 c4,6 8,6 8,0 c0,-10 6,-16 12,-22 c0,10 8,14 10,24 c4,12 -4,22 -16,22 z" fill="#fde047"/>
      </g>
    </g>
    <rect x="14" y="476" width="92" height="26" rx="4" class="outline panel"/>
    <!-- ash door: vent slots instead of a label -->
    <g id="ribs">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${29 + i * 10}" y="482" width="4" height="14" rx="2" class="rib"/>`).join("")}</g>
    <!-- combustion air fan in the ash door instead of the vent slots: spins faster with a higher % -->
    <g id="grp-fan" class="click" data-entity="fan"><title data-i18n="fan"></title>
      <g transform="translate(22,478) scale(.92)"><path id="fan-icon" d="${MDI_FAN}" class="mdi-icon"/></g>
      <text id="val-fan" x="74" y="495" text-anchor="middle" class="val" font-size="15"></text>
    </g>
  </g>
  <!-- pipe temperatures without labels (the colour and position say enough); the name is the hover tooltip -->
  <g class="click" data-entity="boiler_supply"><title data-i18n="boiler_supply"></title>
    <text id="val-boiler-supply" x="${L.valBoilerSupply[0]}" y="${L.valBoilerSupply[1]}" text-anchor="middle" class="val"></text>
  </g>
  <g class="click" data-entity="boiler_return"><title data-i18n="boiler_return"></title>
    <text id="val-boiler-return" x="${L.valBoilerReturn[0]}" y="${L.valBoilerReturn[1]}" text-anchor="middle" class="val"></text>
  </g>

  <g class="click" data-entity="valve" transform="${t(L.valve)}"><title data-i18n="valve"></title>
    <!-- disc split in half, turning with the valve: the hot half joins the boiler supply (N) with the heating supply
         (E) when open and with the boiler return (W) when closed; the other half carries the return water the same
         way. Hot half in the boiler supply colour, the other in the heating return colour. -->
    <circle r="20" class="box" stroke-width="2"/>
    <g id="valve-disc">
      <path id="valve-hot" fill="${OFF}" d="M-14.14,-14.14 A20,20 0 0 1 14.14,14.14 Z"/>
      <path id="valve-cold" fill="${OFF}" d="M14.14,14.14 A20,20 0 0 1 -14.14,-14.14 Z"/>
      <path d="M-14.14,-14.14 L14.14,14.14" class="valve-ring" stroke-width="2.5"/>
    </g>
    <!-- a halo in the card colour separates the ring from the pipes, so it stays visible on dark themes -->
    <circle r="22.5" fill="none" stroke="var(--card-background-color, #fff)" stroke-width="3"/>
    <circle r="20" fill="none" class="valve-ring" stroke-width="2.5"/>
    <circle r="3" class="dot"/>
  </g>
  <!-- slider: the pill with the position slides along the track (drag it or click the track) -->
  <g id="grp-valve" transform="${t(L.valvePill)}">
    <rect x="-94" y="-18" width="188" height="36" fill="transparent"/>
    <rect id="valve-track" x="-66" y="-5" width="132" height="10" rx="5" class="track"/>
    <rect id="valve-fill" x="-66" y="-5" height="10" rx="5"/>
    <g id="valve-thumb">
      <rect x="-26" y="-14" width="52" height="28" rx="14" id="valve-pill" class="thumb"/>
      <text id="val-valve" text-anchor="middle" y="6" fill="#fff" font-weight="bold" font-size="16"></text>
    </g>
  </g>

  <g id="grp-pump" data-entity="pump" transform="${t(L.pump)}"><title data-i18n="pump"></title>
    <circle r="16" fill="#fff" stroke="#5f6368" stroke-width="2"/>
    <g id="impeller">${PUMP_VANES}<circle r="2.5" fill="#fff" stroke="#5f6368"/></g>
  </g>
  <!-- pump state as an ON/OFF pill, like the hot water valve -->
  <g id="grp-pump-pill" data-entity="pump" transform="translate(${L.pump[0]},${L.pump[1] - 32})"><title data-i18n="pump"></title>
    <rect x="-21" y="-11" width="42" height="22" rx="11" id="pump-pill"/>
    <text id="st-pump" text-anchor="middle" y="5" fill="#fff" font-weight="bold" font-size="14"></text>
  </g>
  <g class="click" data-entity="supply">
    <title data-i18n="supply"></title>
    <text id="val-supply" x="${L.valSupply[0]}" y="${L.valSupply[1]}" class="val"></text>
  </g>
  <g class="click" data-entity="return">
    <title data-i18n="return"></title>
    <text id="val-return" x="${L.valReturn[0]}" y="${L.valReturn[1]}" class="val"></text>
  </g>

  <g transform="${t(L.house)}">
  <g id="grp-pv">
    <g id="pv-beams" stroke="#fbbc04" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" opacity=".8" class="beams">
      <path d="M254,-22 L346,48"/><path d="M250,-14 L334,62"/><path d="M256,-30 L358,30"/>
    </g>
    <g id="pv-sun" transform="translate(238,-34)">
      <g id="pv-rays" stroke-width="2.2" stroke-linecap="round">${SUN_RAYS}</g>
      <circle r="9"/>
    </g>
    <!-- two horizontal gauges, a faint divider and the total -->
    <g id="row-pv1" class="click" data-entity="pv1">
      <text id="lbl-pv1" x="312" y="-68" class="lbl"></text>
      <text id="val-pv1" x="476" y="-68" text-anchor="end" class="val"></text>
      <rect x="312" y="-61" width="164" height="6" rx="3" class="pv-track"/>
      <rect id="bar-pv1" x="312" y="-61" width="0" height="6" rx="3" fill="${PV_COLORS[0]}"/>
    </g>
    <g id="row-pv2" class="click" data-entity="pv2">
      <text id="lbl-pv2" x="312" y="-37" class="lbl"></text>
      <text id="val-pv2" x="476" y="-37" text-anchor="end" class="val"></text>
      <rect x="312" y="-30" width="164" height="6" rx="3" class="pv-track"/>
      <rect id="bar-pv2" x="312" y="-30" width="0" height="6" rx="3" fill="${PV_COLORS[1]}"/>
    </g>
    <g id="pv-total">
      <rect x="312" y="-14" width="164" height="1.5" fill="url(#grad-divider)"/>
      <text x="394" y="9" text-anchor="middle"><tspan class="lbl" data-i18n="pv_total"></tspan><tspan id="val-pv-total" class="val big18" dx="8"></tspan></text>
    </g>
  </g>

  <!-- power pole with the line to the house; dashes run along the wire (import: to the house, export: to the pole).
       No label: the colour and the direction of the dashes say import / export, the name is the tooltip. -->
  <g id="grp-grid">
    <path id="grid-wire" d="M211,9 Q258,66 316,92" fill="none" class="wire"/>
    <path id="grid-flow" d="M211,9 Q258,66 316,92" fill="none" class="grid-flow"/>
    <g class="pole">
      <path d="M200,2 V62 M196,62 H204"/>
      <path d="M189,10 H211 M192,19 H208" class="pole-arm"/>
      <path d="M200,2 L190,10 M200,2 L210,10" class="pole-brace"/>
      <circle cx="189.5" cy="8.5" r="1.8"/><circle cx="210.5" cy="8.5" r="1.8"/><circle cx="192.5" cy="17.5" r="1.6"/><circle cx="207.5" cy="17.5" r="1.6"/>
    </g>
    <g class="click" data-entity="grid"><title data-i18n="grid"></title>
      <text id="val-grid" x="186" y="40" text-anchor="end" class="val"></text>
    </g>
  </g>
  <!-- battery storage between the pole and the house, under the line: charge level, %, power (▲ charging,
       ▼ discharging); a cable to the house wall carries dashes like the grid line -->
  <g id="grp-battery"><title data-i18n="battery"></title>
    <path id="batt-wire" d="M220,104 V109 H316" fill="none" class="wire"/>
    <path id="batt-flow" d="M220,104 V109 H316" fill="none" class="grid-flow"/>
    <rect x="216" y="69" width="8" height="4" rx="1" class="batt-frame"/>
    <rect x="212" y="72" width="16" height="32" rx="3" class="batt-frame" stroke-width="2"/>
    <rect id="batt-level" x="214.5" width="11" rx="1.5"/>
    <path id="batt-bolt" d="${MDI_FLASH}" transform="translate(215.2,83.2) scale(.4)" fill="#fff"/>
    <g class="click" data-entity="battery_soc"><text id="val-batt-soc" x="234" y="87" class="val" font-size="15"></text></g>
    <g class="click" data-entity="battery_power"><text id="val-batt-power" x="234" y="103" class="lbl" font-size="12" font-weight="bold"></text></g>
  </g>

  <g id="house">
    <rect x="440" y="38" width="16" height="32" class="roof-dark"/>
    <rect x="436" y="34" width="24" height="6" rx="1.5" class="roof-dark"/>
    <path d="M302,82 L394,28 L486,82 Z" class="roof" stroke-width="2" stroke-linejoin="round"/>
    <path d="M394,37 L456,74" fill="none" stroke="#9a3412" stroke-width="1.5" stroke-opacity=".6"/>
    <g id="pv-panels">
      <clipPath id="pv-clip"><polygon points="${PV_FIELD}"/></clipPath>
      <polygon points="${PV_FIELD}" class="pv-module"/>
      <path d="${PV_GRID}" class="pv-grid" clip-path="url(#pv-clip)"/>
      <polygon points="${PV_FIELD}" fill="none" stroke="#93c5fd" stroke-width="1"/>
    </g>
    <circle cx="394" cy="62" r="9" class="glass"/>
    <path d="M394,53 V71 M385,62 H403" class="outline-stroke" stroke-width="1.2"/>
    <rect x="316" y="82" width="156" height="138" rx="4" class="box wall" stroke-width="2"/>
    <rect x="320" y="154" width="148" height="62" rx="4" fill="url(#grad-rad)" fill-opacity=".25"/>
    <g fill="url(#grad-rad)">${RAD_FINS}</g>
    <!-- consumption = PV + grid (import positive), at the top of the house -->
    <g id="grp-usage">
      <path id="usage-icon" d="${MDI_FLASH}" transform="translate(360,92) scale(.65)" fill="#f59e0b"/>
      <text id="val-usage" x="402" y="106" text-anchor="middle" class="lbl" font-weight="bold"></text>
    </g>
    <g class="click" data-entity="room">
      <text id="val-room" x="394" y="142" text-anchor="middle" class="val big22"></text>
    </g>
  </g>
  <g id="grp-thermostat" transform="translate(394,256)">
    <path d="${MDI_THERMOSTAT}" transform="translate(-10,-31) scale(.85)" class="mdi-icon"><title data-i18n="thermostat"></title></path>
    <g class="btn" id="btn-sp-down" transform="translate(-56,0)">${MINUS}</g>
    <text id="val-setpoint" class="val click" data-entity="thermostat" text-anchor="middle" y="5"></text>
    <g class="btn" id="btn-sp-up" transform="translate(56,0)">${PLUS}</g>
  </g>
  </g>

  <!-- horizontal tank: name + temperature on top, coil (vertical loops) in the middle, heater at the bottom -->
  <g transform="${t(L.tank)}">
    <g class="click" data-entity="hotwater">
      <rect x="336" y="290" width="140" height="102" rx="36" fill="url(#grad-tank)" fill-opacity=".3" class="outline-stroke" stroke-width="2"/>
      <text x="406" y="312" text-anchor="middle"><tspan class="title" data-i18n="hotwater"></tspan><tspan id="val-hotwater" class="val" dx="8"></tspan></text>
    </g>
    <path id="hw-coil" d="${COIL}" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path id="heater" d="M380,380 l4,-5 l7,10 l7,-10 l7,10 l7,-10 l7,10 l7,-10 l4,5" fill="none" stroke-width="3" stroke-linejoin="round"/>
    <g id="grp-heater" class="click" data-entity="heater" transform="translate(360,402)">
      <path id="heater-icon" d="M11,15H6L13,1V9H18L11,23V15Z" transform="scale(.8)"/>
      <text x="20" y="14" class="lbl" data-i18n="heater"></text>
      <text id="st-heater" x="78" y="14" class="val"></text>
    </g>
  </g>
  <g id="grp-hw-valve">
    <g class="click" data-entity="hotwater_valve" transform="translate(${L.hwValve[0]},${L.hwValve[1]}) rotate(${L.hwValve[2]})">
      <rect x="-7" y="-28" width="14" height="10" rx="2" class="box" stroke-width="1.5"/>
      <path d="M0,-18 V-12" class="outline-stroke" stroke-width="2"/>
      <circle r="12" class="box" stroke-width="2"/>
      <rect id="hw-valve-bore" x="-10" y="-4" width="20" height="8" rx="2"/>
    </g>
    <g id="btn-hw-valve" transform="${t(L.hwPill)}">
      <rect x="-21" y="-11" width="42" height="22" rx="11" id="hw-valve-pill"/>
      <text id="val-hw-valve" text-anchor="middle" y="5" fill="#fff" font-weight="bold" font-size="14"></text>
    </g>
    <text x="${L.hwLbl[0]}" y="${L.hwLbl[1]}" text-anchor="middle" class="lbl click" data-entity="hotwater_valve" font-size="13"><tspan data-i18n="hw_valve_1"></tspan><tspan x="${L.hwLbl[0]}" dy="13" data-i18n="hw_valve_2"></tspan></text>
  </g>

  <g transform="${t(L.legend)}">
    <rect width="130" height="7" rx="2" fill="url(#grad-legend)"/>
    <text id="lg-min" class="lbl" x="0" y="-5" font-size="13"></text>
    <text id="lg-mid" class="lbl" x="65" y="-5" text-anchor="middle" font-size="13"></text>
    <text id="lg-max" class="lbl" x="130" y="-5" text-anchor="end" font-size="13"></text>
    <rect x="150" width="26" height="7" rx="3.5" class="off-fill"/>
    <text class="lbl" x="182" y="7" font-size="13" data-i18n="no_flow"></text>
  </g>
</svg>`;
}

const STYLE = `
  :host { display: block; }
  ha-card { padding: 8px 8px 4px; overflow: hidden; }
  .card-title { padding: 4px 8px 0; font-size: 1.2em; color: var(--primary-text-color); }
  svg { width: 100%; height: auto; display: block; margin: 0 auto; }
  svg.portrait { max-width: 560px; }
  .pipe { fill: none; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; transition: stroke .4s; }
  .flow { stroke-dasharray: 2 18; stroke-width: 3; stroke: #fff; stroke-opacity: .55; fill: none; stroke-linecap: round;
          animation: flow 1.2s linear infinite; }
  @keyframes flow { to { stroke-dashoffset: -20; } }
  .lbl { fill: var(--secondary-text-color, #5f6368); font-size: 14px; }
  .mdi-icon { fill: var(--secondary-text-color, #5f6368); }
  .val { fill: var(--primary-text-color, #202124); font-size: 16px; font-weight: bold; }
  .big18 { font-size: 20px; }
  .big28 { font-size: 28px; }
  .big22 { font-size: 24px; }
  .title { fill: var(--primary-text-color, #202124); font-size: 16px; font-weight: bold; }
  .box { fill: var(--card-background-color, #fff); stroke: var(--secondary-text-color, #5f6368); }
  .outline { fill: none; stroke: var(--secondary-text-color, #5f6368); stroke-width: 1.5; }
  /* tinted backgrounds mixed with the card colour, so they work in light and dark themes */
  .wall { fill: color-mix(in srgb, #9aa0a6 22%, var(--card-background-color, #fff)); }
  .steel { fill: color-mix(in srgb, #7f97b2 26%, var(--card-background-color, #fff)); }
  .pv-module { fill: #1e3a8a; transition: fill .4s; }
  .pv-module.producing { fill: #2563eb; }
  .pv-track { fill: var(--secondary-text-color, #5f6368); fill-opacity: .18; }
  .divider-stop { stop-color: var(--secondary-text-color, #5f6368); }
  #bar-pv1, #bar-pv2 { transition: width .6s ease; }
  /* sun beams run from the sun to the panels, faster with more PV power */
  .beams path { animation: dash8 1s linear infinite; animation-duration: inherit; }
  @keyframes dash8 { to { stroke-dashoffset: -16; } }
  .wire { stroke: var(--secondary-text-color, #5f6368); stroke-width: 1.5; stroke-opacity: .7; }
  .grid-flow { stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: 3 11; animation: dash14 1s linear infinite; }
  @keyframes dash14 { to { stroke-dashoffset: -28; } }
  .grid-flow.export { animation-direction: reverse; }
  .grid-flow.idle { display: none; }
  .pole path { stroke: var(--secondary-text-color, #5f6368); stroke-width: 3.5; stroke-linecap: round; fill: none; }
  .pole .pole-arm { stroke-width: 3; }
  .pole .pole-brace { stroke-width: 1.5; }
  .pole circle { fill: var(--secondary-text-color, #5f6368); }
  .pv-grid { stroke: #93c5fd; stroke-width: .8; fill: none; }
  .rib { fill: var(--secondary-text-color, #5f6368); fill-opacity: .7; }
  .panel { fill: var(--card-background-color, #fff); }
  .outline-stroke { stroke: var(--secondary-text-color, #5f6368); }
  .valve-ring { stroke: var(--primary-text-color, #202124); }
  .frame-fill { fill: var(--secondary-text-color, #5f6368); }
  #valve-disc { transform-box: fill-box; transform-origin: center; transition: transform .6s ease; }
  #valve-hot, #valve-cold { transition: fill .6s ease; }
  .dot { fill: var(--primary-text-color, #202124); }
  .smoke { fill: var(--secondary-text-color, #5f6368); fill-opacity: .35; }
  .batt-frame { fill: var(--card-background-color, #fff); stroke: var(--secondary-text-color, #5f6368); }
  #fan-icon.spin { animation-timing-function: linear; }
  .val.flue { fill: var(--secondary-text-color, #5f6368); font-size: 14px; }
  .roof { fill: #c2410c; stroke: var(--secondary-text-color, #5f6368); }
  .roof-dark { fill: #9a3412; stroke: var(--secondary-text-color, #5f6368); stroke-width: 1.5; }
  .glass { fill: #bfdbfe; stroke: var(--secondary-text-color, #5f6368); stroke-width: 1.5; }
  .off-fill { fill: ${OFF}; }
  .click { cursor: pointer; }
  .click:hover { opacity: .75; }
  .btn { cursor: pointer; }
  .track { fill: #9aa0a6; fill-opacity: .35; }
  .thumb { stroke: var(--card-background-color, #fff); stroke-width: 2; }
  #grp-valve.settable { cursor: pointer; touch-action: none; }
  #grp-valve.settable.dragging { cursor: grabbing; }
  .btn circle { fill: var(--card-background-color, #fff); stroke: var(--primary-color, #1a73e8); stroke-width: 1.5; }
  .btn path { stroke: var(--primary-color, #1a73e8); stroke-width: 3.5; stroke-linecap: round; fill: none; }
  .btn:hover circle { fill: var(--primary-color, #1a73e8); fill-opacity: .15; }
  .hidden { display: none; }
  .spin { transform-box: fill-box; transform-origin: center; animation: spin 1.6s steps(48) infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .flame { transform-box: fill-box; transform-origin: 50% 100%; animation: flick .9s ease-in-out infinite alternate; }
  @keyframes flick { from { transform: scale(1, .92); } to { transform: scale(.94, 1.06); } }
  @media (prefers-reduced-motion: reduce) { .spin, .flame, .flow, .grid-flow, .beams path { animation: none; } }
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
    if (config.layout && !["auto", "portrait", "landscape"].includes(config.layout))
      throw new Error("layout: must be auto, portrait or landscape");
    for (const k of ["grid_invert", "battery_invert"])
      if (config[k] !== undefined && typeof config[k] !== "boolean") throw new Error(`${k}: must be true or false`);
    if (config.burner_states !== undefined && !(Array.isArray(config.burner_states) || typeof config.burner_states === "string"))
      throw new Error("burner_states: must be a list of states");
    for (const k of ["pv1_name", "pv2_name"])
      if (config[k] !== undefined && typeof config[k] !== "string") throw new Error(`${k}: must be text`);
    for (const k of Object.keys(DEFAULTS))
      if (config[k] !== undefined && !Number.isFinite(Number(config[k]))) throw new Error(`${k}: must be a number`);
    const c = { ...DEFAULTS, ...config, entities: { ...(config.entities || {}) } };
    for (const k of Object.keys(DEFAULTS)) c[k] = Number(c[k]);
    if (c.max_temp <= c.min_temp) throw new Error("max_temp must be greater than min_temp");
    if (c.pv1_max <= 0 || c.pv2_max <= 0) throw new Error("pv1_max / pv2_max must be greater than 0");
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

  // Below this card width the portrait drawing is used (phones, narrow columns). The landscape drawing is 680 units
  // wide, so from 760 px on its text is at least as large as in the portrait one (500 units shown up to 560 px).
  _wantedLayout() {
    const l = this._config.layout;
    if (l === "portrait" || l === "landscape") return l;
    const w = this.clientWidth;
    return w && w >= 760 ? "landscape" : "portrait";
  }

  connectedCallback() {
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        // rebuild outside the observer callback (avoids "ResizeObserver loop" warnings)
        requestAnimationFrame(() => {
          if (this._root && this._config && this._wantedLayout() !== this._layout) this._build();
        });
      });
    }
    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }

  _build() {
    if (!this._root) this._root = this.attachShadow({ mode: "open" });
    this._layout = this._wantedLayout();
    this._lang = pickLang(this._config, this._hass);
    const t = I18N[this._lang];
    const title = this._config.title ?? t.title;
    this._root.innerHTML = `<style>${STYLE}</style><ha-card>${title ? `<div class="card-title"></div>` : ""}${buildSvg(LAYOUTS[this._layout])}</ha-card>`;
    this._root.querySelector("svg").classList.add(this._layout);
    if (title) this._root.querySelector(".card-title").textContent = title;
    this._root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t[el.dataset.i18n]; });
    const $ = (id) => this._root.getElementById(id);
    this.$ = $;
    this._wxKey = undefined;

    $("lbl-pv1").textContent = this._config.pv1_name ?? t.pv1;
    $("lbl-pv2").textContent = this._config.pv2_name ?? t.pv2;

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
    this._bindValveSlider($("grp-valve"), $("valve-track"));
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
    if (key === "outdoor" && !e.outdoor) return e.weather;
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

  // Power in kW, whatever unit the sensor reports (W, kW, MW).
  _kw(key) {
    const st = this._state(key);
    const v = st ? parseFloat(st.state) : NaN;
    if (!Number.isFinite(v)) return NaN;
    const unit = st.attributes.unit_of_measurement;
    return unit === "W" ? v / 1000 : unit === "MW" ? v * 1000 : v;
  }

  _fmtKw(v) {
    if (!Number.isFinite(v)) return "—";
    const digits = Math.abs(v) < 10 ? 2 : 1;
    return `${new Intl.NumberFormat(this._lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v)} kW`;
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
    // the pump follows its entity when one is set, otherwise the boiler supply temperature
    this._pumpOn = e.pump ? this._isOn("pump") === true : this._threshold(this._pumpOn, bs, c.pump_on, c.pump_hysteresis);
    // the fire follows the boiler state entity when one is set (any text state listed in burner_states),
    // otherwise the boiler supply temperature
    const burnerSt = this._state("burner");
    if (e.burner) {
      const states = [].concat(c.burner_states ?? BURNER_STATES).map((x) => String(x).trim().toLowerCase());
      this._burning = !!burnerSt && states.includes(String(burnerSt.state).trim().toLowerCase());
    } else this._burning = this._threshold(this._burning, bs, c.burning_on, c.burning_hysteresis);
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
    // tank: coil inlet (supply) on the left, outlet (return) on the right; without flow the tank temperature only
    const tankCol = (t) => (Number.isFinite(t) ? col(t) : Number.isFinite(hw) ? col(hw) : OFF);
    $("grad-tank-in").setAttribute("stop-color", hwFlow ? tankCol(sup) : tankCol(hw));
    $("grad-tank-out").setAttribute("stop-color", hwFlow ? tankCol(ret) : tankCol(hw));

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

    // photovoltaics: the sun shines while either inverter produces
    const pv = [this._kw("pv1"), this._kw("pv2")];
    const producing = pv.some((v) => v > 0.005);
    $("grp-pv").classList.toggle("hidden", !e.pv1 && !e.pv2);
    $("pv-panels").classList.toggle("hidden", !e.pv1 && !e.pv2);
    ["pv1", "pv2"].forEach((k, i) => {
      $(`row-${k}`).classList.toggle("hidden", !e[k]);
      $(`val-${k}`).textContent = this._fmtKw(pv[i]);
      const f = Number.isFinite(pv[i]) ? Math.min(1, Math.max(0, pv[i] / c[`${k}_max`])) : 0;
      $(`bar-${k}`).setAttribute("width", (164 * f).toFixed(1));
    });
    // the total only makes sense with both inverters
    $("pv-total").classList.toggle("hidden", !(e.pv1 && e.pv2));
    $("val-pv-total").textContent = this._fmtKw(pv.filter(Number.isFinite).reduce((a, b) => a + b, 0));
    $("pv-sun").setAttribute("fill", producing ? "#fbbc04" : OFF);
    $("pv-rays").setAttribute("stroke", producing ? "#fbbc04" : OFF);
    $("pv-beams").style.display = producing ? "" : "none";
    const pvTotal = pv.filter(Number.isFinite).reduce((a, b) => a + b, 0);
    $("pv-beams").style.animationDuration = `${Math.min(4, Math.max(0.3, 2 / Math.max(pvTotal, 0.01))).toFixed(2)}s`;
    this._root.querySelectorAll(".pv-module").forEach((m) => m.classList.toggle("producing", producing));

    // grid: dashes run to the house while importing, back to the pole while exporting; faster with more power
    $("grp-grid").classList.toggle("hidden", !e.grid);
    let grid = this._kw("grid");
    if (c.grid_invert) grid = -grid;
    const flowEl = $("grid-flow");
    const active = Number.isFinite(grid) && Math.abs(grid) >= 0.01;
    flowEl.setAttribute("class", `grid-flow${active ? (grid < 0 ? " export" : "") : " idle"}`);
    flowEl.style.stroke = grid < 0 ? "#22c55e" : "#ef4444";
    flowEl.style.animationDuration = active ? `${Math.min(4, Math.max(0.25, 1.5 / Math.abs(grid))).toFixed(2)}s` : "";
    $("val-grid").textContent = this._fmtKw(Number.isFinite(grid) ? Math.abs(grid) : NaN);
    $("val-grid").style.fill = active ? (grid < 0 ? "#22c55e" : "#ef4444") : "";
    // house consumption: what the panels give plus what comes from the grid (export lowers it)
    $("grp-usage").classList.toggle("hidden", !e.grid);
    // battery: + = charging (battery_invert flips it); charging takes power away from the house
    let batt = this._kw("battery_power");
    if (c.battery_invert) batt = -batt;
    const soc = this._num("battery_soc");
    $("grp-battery").classList.toggle("hidden", !e.battery_soc && !e.battery_power);
    const f = Number.isFinite(soc) ? Math.min(1, Math.max(0, soc / 100)) : 0;
    $("batt-level").setAttribute("y", (101.5 - 27 * f).toFixed(1));
    $("batt-level").setAttribute("height", (27 * f).toFixed(1));
    $("batt-level").setAttribute("fill", soc < 20 ? "#ef4444" : soc < 50 ? "#f59e0b" : "#22c55e");
    $("val-batt-soc").textContent = Number.isFinite(soc) ? `${Math.round(soc)}%` : "";
    const battActive = Number.isFinite(batt) && Math.abs(batt) >= 0.01;
    $("batt-bolt").style.display = battActive && batt > 0 ? "" : "none";
    $("val-batt-power").textContent = !e.battery_power ? "" : battActive
      ? `${batt > 0 ? "▲" : "▼"} ${this._fmtKw(Math.abs(batt))}` : this._fmtKw(0);
    $("val-batt-power").style.fill = battActive ? (batt > 0 ? "#22c55e" : "#f59e0b") : "";
    // cable dashes: to the battery while charging, to the house while discharging; faster with more power
    const bFlow = $("batt-flow");
    bFlow.setAttribute("class", `grid-flow${battActive ? (batt > 0 ? " export" : "") : " idle"}`);
    bFlow.style.stroke = batt > 0 ? "#22c55e" : "#f59e0b";
    bFlow.style.animationDuration = battActive ? `${Math.min(4, Math.max(0.25, 1.5 / Math.abs(batt))).toFixed(2)}s` : "";
    $("val-usage").textContent = this._fmtKw(Number.isFinite(grid)
      ? Math.max(0, pvTotal + grid - (Number.isFinite(batt) ? batt : 0)) : NaN);
    // the icon sits just left of the centred value (its width changes with the number)
    const usageW = e.grid ? $("val-usage").getComputedTextLength() : 0;
    if (usageW) $("usage-icon").setAttribute("transform", `translate(${(402 - usageW / 2 - 17).toFixed(1)},92) scale(.65)`);

    // outdoor: temperature sensor, or the weather entity's temperature; icon from the weather condition
    const wx = this._state("weather");
    let out = this._num("outdoor");
    if (!e.outdoor && wx) out = Number(wx.attributes.temperature);
    const night = this._hass.states["sun.sun"]?.state === "below_horizon";
    const wxKey = `${wx ? wx.state : ""}|${night}`;
    if (this._wxKey !== wxKey) {
      this._wxKey = wxKey;
      $("wx-icon").innerHTML = weatherIcon(wx ? wx.state : "", night);
    }
    $("grp-outdoor").classList.toggle("hidden", !e.outdoor && !e.weather);
    $("val-outdoor").textContent = this._fmt(out, 0).replace(/^-0 /, "0 ");
    $("val-outdoor").style.fill = out < 0 ? "#3b82f6" : "";

    let room = this._num("room");
    if (!e.room && this._domain(e.thermostat) === "climate")
      room = Number(this._state("thermostat")?.attributes.current_temperature);
    $("val-room").textContent = this._fmt(room);

    // pump and fire
    $("impeller").classList.toggle("spin", pump);
    $("impeller").setAttribute("fill", pump ? "#1a73e8" : "#9aa0a6");
    $("st-pump").textContent = pump ? "ON" : "OFF";
    $("pump-pill").setAttribute("fill", pump ? "#188038" : "#5f6368");
    ["grp-pump", "grp-pump-pill"].forEach((id) => $(id).classList.toggle("click", !!e.pump));
    const burning = this._burning;
    $("flame").style.display = burning ? "" : "none";
    $("smoke").style.display = burning ? "" : "none";
    $("grp-flue").classList.toggle("hidden", !e.flue);
    $("val-flue").textContent = this._fmt(this._num("flue"), 0);
    // a text state (e.g. "Rozpalanie", "Wygaszanie") is shown as it is; on/off and the temperature rule as pali się / wygaszony
    const burnerText = e.burner && burnerSt && !["on", "off"].includes(burnerSt.state)
      ? (this._hass.formatEntityState?.(burnerSt) ?? burnerSt.state) : null;
    $("st-burner").textContent = burnerText ?? (burning ? t.burning : t.out);

    // combustion fan
    const fanSt = this._state("fan");
    const fanPct = !fanSt ? NaN : this._domain(fanSt.entity_id) === "fan"
      ? (fanSt.state === "off" ? 0 : Number(fanSt.attributes.percentage)) : parseFloat(fanSt.state);
    $("grp-fan").classList.toggle("hidden", !e.fan);
    $("ribs").classList.toggle("hidden", !!e.fan);
    $("val-fan").textContent = Number.isFinite(fanPct) ? `${Math.round(fanPct)}%` : "—";
    const fanOn = fanPct > 0;
    $("fan-icon").classList.toggle("spin", fanOn);
    $("fan-icon").style.animationDuration = fanOn ? `${Math.min(4, Math.max(0.3, 60 / fanPct)).toFixed(2)}s` : "";
    $("fan-icon").style.fill = fanOn ? "#1a73e8" : "";

    // 4D valve disc. Ports: N boiler supply, E heating supply, S heating return, W boiler return.
    // 100 %: hot half N–E (boiler water to the house), cold half S–W (return to the boiler).
    //   0 %: turned 90° back: hot N–W (the boiler loops on itself), cold S–E (the house loops on itself).
    const pos = this._pendingValve ?? this._valvePos();
    const open = Number.isFinite(pos) ? Math.min(1, Math.max(0, pos / 100)) : 0.5;
    $("valve-disc").style.transform = `rotate(${(-90 * (1 - open)).toFixed(1)}deg)`;
    $("valve-hot").setAttribute("fill", pump && Number.isFinite(bs) ? col(bs) : OFF);
    $("valve-cold").setAttribute("fill", pump && Number.isFinite(ret) ? col(ret) : OFF);
    $("grp-valve").classList.toggle("hidden", !e.valve);
    $("val-valve").textContent = Number.isFinite(pos) ? `${Math.round(pos)}%` : "—";
    const valveCol = pos > 0 ? "#188038" : "#5f6368";
    $("valve-pill").setAttribute("fill", valveCol);
    const vf = this._valveFrac(pos);
    $("valve-thumb").setAttribute("transform", `translate(${(-66 + 132 * vf).toFixed(1)},0)`);
    $("valve-fill").setAttribute("width", (132 * vf).toFixed(1));
    $("valve-fill").setAttribute("fill", valveCol);
    $("grp-valve").classList.toggle("settable", this._valveSettable());

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

  _valveSettable() {
    return ["number", "input_number", "cover", "valve"].includes(this._domain(this._config.entities.valve));
  }

  _valveRange() {
    const st = this._state("valve");
    const min = Number(st?.attributes.min ?? 0);
    const max = Number(st?.attributes.max ?? 100);
    return max > min ? [min, max] : [0, 100];
  }

  _valveFrac(pos) {
    const [min, max] = this._valveRange();
    return Number.isFinite(pos) ? Math.min(1, Math.max(0, (pos - min) / (max - min))) : 0;
  }

  // Drag the pill or click the track; the position follows the pointer (rounded to valve_step) and is sent on release.
  // A read-only valve (sensor) opens more-info instead.
  _bindValveSlider(grp, track) {
    const at = (ev) => {
      const r = track.getBoundingClientRect();
      const [min, max] = this._valveRange();
      const step = this._config.valve_step || 1;
      const f = r.width ? Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)) : 0;
      return Math.min(max, Math.max(min, Math.round((min + f * (max - min)) / step) * step));
    };
    grp.addEventListener("pointerdown", (ev) => {
      const id = this._config.entities.valve;
      if (!id) return;
      ev.stopPropagation();
      if (!this._valveSettable()) {
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
        return;
      }
      clearTimeout(this._valveTimer);
      try { grp.setPointerCapture(ev.pointerId); } catch (_) { /* synthetic events have no capture */ }
      grp.classList.add("dragging");
      this._pendingValve = at(ev);
      this._update();
      const move = (e) => { this._pendingValve = at(e); this._update(); };
      const up = (e) => {
        grp.removeEventListener("pointermove", move);
        grp.removeEventListener("pointerup", up);
        grp.removeEventListener("pointercancel", up);
        grp.classList.remove("dragging");
        this._setValve(e.type === "pointercancel" ? this._pendingValve : at(e));
      };
      grp.addEventListener("pointermove", move);
      grp.addEventListener("pointerup", up);
      grp.addEventListener("pointercancel", up);
    });
  }

  _setValve(v) {
    const st = this._state("valve");
    if (!st || !Number.isFinite(v)) return;
    const d = this._domain(st.entity_id);
    this._pendingValve = v;
    this._update();
    if (d === "cover") this._hass.callService("cover", "set_cover_position", { entity_id: st.entity_id, position: v });
    else if (d === "valve") this._hass.callService("valve", "set_valve_position", { entity_id: st.entity_id, position: v });
    else this._hass.callService(d, "set_value", { entity_id: st.entity_id, value: v });
    clearTimeout(this._valveTimer);
    this._valveTimer = setTimeout(() => { this._pendingValve = undefined; this._update(); }, 1500);
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
      { name: "layout", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "auto" }, { value: "portrait", label: "portrait" }, { value: "landscape", label: "landscape" }] } } },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "pl", label: "Polski" }, { value: "en", label: "English" }] } } },
      {
        name: "entities", type: "expandable", expanded: true, schema: [
          ent("boiler_supply", "sensor"), ent("boiler_return", "sensor"), ent("supply", "sensor"), ent("return", "sensor"),
          ent("hotwater", "sensor"), ent("hotwater_valve", ["switch", "binary_sensor", "input_boolean", "valve"]),
          ent("heater", ["binary_sensor", "switch", "input_boolean"]), ent("room", "sensor"), ent("outdoor", "sensor"),
          ent("valve", ["number", "input_number", "sensor", "cover", "valve"]),
          ent("thermostat", ["climate", "number", "input_number"]), ent("weather", "weather"), ent("grid", "sensor"), ent("pv1", "sensor"), ent("pv2", "sensor"),
          ent("pump", ["binary_sensor", "switch", "input_boolean"]), ent("flue", "sensor"), { name: "burner", selector: { entity: {} } },
          ent("fan", ["sensor", "fan", "number", "input_number"]), ent("battery_soc", "sensor"), ent("battery_power", "sensor"),
        ],
      },
      { name: "pv", type: "expandable", flatten: true, schema: [
        { name: "grid_invert", selector: { boolean: {} } }, { name: "battery_invert", selector: { boolean: {} } },
        { name: "pv1_name", selector: { text: {} } }, num("pv1_max", 0.1, 1000, 0.1),
        { name: "pv2_name", selector: { text: {} } }, num("pv2_max", 0.1, 1000, 0.1),
      ] },
      {
        name: "logic", type: "expandable", flatten: true, schema: [
          num("pump_on", 0, 100, 0.5), num("pump_hysteresis", 0, 20, 0.5),
          num("burning_on", 0, 100, 0.5), num("burning_hysteresis", 0, 20, 0.5),
          { name: "burner_states", selector: { text: { multiple: true } } },
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
