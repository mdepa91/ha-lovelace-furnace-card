# Furnace card

A Home Assistant Lovelace card that draws a boiler room: the boiler (CO), the 4-way mixing valve, the heating pump on
the hot side of the valve, the underfloor heating in the house (with a washer and a dryer) and the hot water tank (CWU) with its zone valve and electric heater.

- **Pipe colours follow the temperature** (20 °C blue → 80 °C red, configurable). Pipes with no flow turn grey.
- **Flow dots** run while the pump works. On the boiler side they slow down as the 4-way valve closes (only the
  open part of the valve takes water from the boiler) and creep at 0 %; the heating side keeps the pump speed.
- **Heating pump:** from its own entity (`binary_sensor`, `switch`, `input_boolean`) when set, otherwise from the
  boiler supply temperature: it runs from `pump_on` °C with a hysteresis. Shown as an ON/OFF pill above the pump.
- **Boiler state:** any entity, also a text one (e.g. "Praca", "Wygaszanie"). Its state is shown on the boiler
  panel and the fire burns while it is one of `burner_states`. Without it the fire follows the boiler supply
  temperature (`burning_on` °C with a hysteresis).
- **Flue gas temperature** (optional) next to the smoke from the boiler.
- **Combustion fan** (optional, %) in the ash door: the fan spins faster with a higher value.
- **Battery storage** (optional) between the pole and the house: charge level with %, the power (▲ charging,
  ▼ discharging) and a cable to the house with dashes running to the battery (charging) or to the house.
- **4-way valve** drawn as a disc split in half that turns with the valve position: the hot half joins the boiler
  supply with the heating supply when open and with the boiler return when closed. The hot half has the boiler supply
  colour, the other the heating return colour. A slider under the valve sets the position (drag the pill or click
  the track; sent on release, rounded to `valve_step`) for
  `number`, `input_number`, `cover` and `valve`; a `sensor` is shown read-only.
- **Hot water tank** lying horizontally, coloured from the coil inlet (heating supply) to the outlet (heating return).
  Its zone valve: open = water flows through the coil, closed = the hot water branch is grey. A `switch` /
  `input_boolean` / `valve` is toggled with the ON/OFF button; a `binary_sensor` is read-only. The electric heater
  glows while it is on.
- **Photovoltaics:** panels on the roof, the sun and two horizontal bars with the power of two inverters (each with
  its own label) and the total below. The sun beams move towards the panels, faster with more power. W, kW and MW
  sensors are all shown in kW.
- **Grid:** a small power pole with a line to the house and the power in kW (no label). Dashes run to the house
  while importing (red) and back to the pole while exporting (green), faster with more power. `grid_invert: true`
  flips the direction.
- **House consumption** at the top of the house: from its own `consumption` sensor when set (click opens more-info),
  otherwise PV total + grid − battery charging (export lowers it), shown when `grid` is set.
- **Underfloor heating** in the house: a coil coloured from the heating supply (left) to the return (right).
- **Appliances** (optional): a washer (water in the door) and a dryer (a wavy drum ring) at the right wall of the house;
  while running the door lights up, the water sloshes and the dryer ring turns red. Any entity: on/off, a power sensor (running above `appliance_power_on` W) or a text state
  (running when it is one of `appliance_states`). Hover shows the state, click opens more-info. After it stops, a
  green check mark shows for `appliance_done_minutes` (default 60). The card remembers a stop it saw (also after a
  reload, in the browser); otherwise an on/off or text entity counts as stopped at its last change, a power sensor
  only when the card saw it running.
- **EV charging** (optional, only a power sensor is needed): a car with a wallbox under the outdoor temperature. While
  charging (from 50 W) the bolt and the wallbox light up and dashes run along the cable, faster with more power; the
  power is shown below. A green check mark after charging stops, like the appliances. The house consumption is not
  changed: a charger behind the meter is already in the grid and PV numbers.
- **Weather icon** follows the condition of a `weather` entity (sun, moon at night, clouds, rain, snow, storm, fog,
  wind).
- **Thermostat setpoint** with − / + under a thermostat icon (`climate` or `number`), optional.
- Pipe temperatures are shown without labels; hover shows the name. Click a value to open the more-info dialog of
  its entity. Elements whose entity is not set are hidden.
- **Two layouts:** portrait (narrow cards, phones) and landscape (wide cards: the boiler sits next to the valve and
  the pump, so the drawing is lower and the text larger). `layout: auto` switches at 760 px card width.
- Polish and English (from the HA language, or `language:`), follows the HA theme (light / dark), visual editor.

## Installation

Copy `furnace-card.js` to `config/www/` and add it under Settings → Dashboards → ⋮ → Resources as
`/local/furnace-card.js` (type *JavaScript module*). Reload the browser.

## Configuration

```yaml
type: custom:furnace-card
title: Kotłownia            # optional, "" hides the title
language: pl               # optional: pl | en
layout: auto               # optional: auto | portrait | landscape (auto = landscape from 760 px card width)
entities:
  boiler_supply: sensor.boiler_supply_temperature   # boiler supply (into the 4-way valve)
  boiler_return: sensor.boiler_return_temperature   # boiler return
  supply: sensor.heating_supply_temperature         # heating supply, after the 4-way valve
  return: sensor.heating_return_temperature         # heating return
  hotwater: sensor.hot_water_temperature            # tank temperature
  hotwater_valve: switch.hot_water_valve            # hot water zone valve (on = open)
  heater: switch.hot_water_heater                   # electric heater in the tank
  room: sensor.living_room_temperature
  outdoor: sensor.outdoor_temperature
  weather: weather.home                             # optional: icon from the condition (and the temperature
                                                    # when no outdoor sensor is set)
  valve: number.mixing_valve_position               # optional, 0..100 %
  thermostat: climate.house                         # optional
  pv1: sensor.inverter_1_power                      # optional, W or kW
  pv2: sensor.inverter_2_power                      # optional
  grid: sensor.grid_power                           # optional, W or kW, + = import, - = export
  consumption: sensor.house_power                   # optional, W or kW; without it: PV + grid - battery charging
  pump: binary_sensor.heating_pump                  # optional; without it the pump follows pump_on
  flue: sensor.flue_gas_temperature                 # optional, shown next to the smoke
  burner: sensor.boiler_state                       # optional, any state (text too); fire from burner_states
  fan: sensor.boiler_fan                            # optional, % (sensor, number or fan with percentage)
  battery_soc: sensor.battery_soc                   # optional, %
  battery_power: sensor.battery_power               # optional, W or kW, + = charging
  washer: sensor.washer_power                       # optional, any state: on/off, power or text
  dryer: sensor.dryer_state                         # optional
  ev_power: sensor.ev_charger_power                 # optional, W or kW
burner_states: [Praca, Rozpalanie]  # boiler states meaning "burning", case-insensitive
                                    # (default: on, praca, pali się, burning, heating, work, running)
appliance_states: [Pranie, Suszenie]  # text states meaning "running", case-insensitive (default: on, run,
                                      # running, washing, drying, spin, pranie, płukanie, wirowanie, suszenie, praca, ...)
appliance_power_on: 5    # W above which a power sensor counts as running (default 5)
appliance_done_minutes: 60  # how long the green "finished" check mark shows after a stop, also for the car (default 60)
battery_invert: false    # true when the battery sensor reports discharging as positive
pv1_name: Falownik 1     # label of the first inverter (default "Falownik 1" / "Inverter 1")
pv2_name: Falownik 2
grid_invert: false       # true when the grid sensor reports export as positive
pv1_max: 10              # kW at which the inverter bar is full (default 10)
pv2_max: 10
pump_on: 40              # °C boiler supply at which the heating pump starts, when no pump entity (default 40)
pump_hysteresis: 2       # pump stops below pump_on - hysteresis (default 2)
burning_on: 45           # °C boiler supply from which the boiler is shown as burning, when no burner entity (default 45)
burning_hysteresis: 2    # default 2
min_temp: 20             # colour scale (default 20..80 °C)
max_temp: 80
valve_step: 5            # 4-way valve slider step in % (default 5)
```

Between `on - hysteresis` and `on` the pump and the fire keep their previous state. After a page reload they start
as off in that band.

## Development

The card is a single file, `furnace-card.js`, with no build step.

- `mockup.html` shows the card with simulated entities and a panel of sliders and switches (temperatures, valves,
  PV, grid, weather, dark theme, wide card). It must sit next to `furnace-card.js`.
- `test/index.html` renders five scenarios (portrait, dark, minimal English, two landscape) with a mocked `hass`.
  Open `test/index.html?test` to click through the controls; the result (service calls, more-info events) is printed
  at the bottom of the page.

## Release

Bump `CARD_VERSION` in `furnace-card.js`, commit, then push an annotated tag with the same number:

```sh
git tag -a v1.0.1 -m "What changed"
git push origin v1.0.1
```

Both GitLab CI (`.gitlab-ci.yml`) and GitHub Actions (`.github/workflows/release.yml`) check that the tag matches
`CARD_VERSION` and create the release with `furnace-card.js` attached; the tag message becomes the release notes.
GitLab needs a runner with the Docker executor. On GitHub the attached file is what HACS downloads.
