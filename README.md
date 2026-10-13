# Furnace card

A Home Assistant Lovelace card that draws a boiler room: the boiler (CO), the 4-way mixing valve, the heating pump on
the hot side of the valve, the house radiators and the hot water tank (CWU) with its zone valve and electric heater.

- **Pipe colours follow the temperature** (20 °C blue → 80 °C red, configurable). Pipes with no flow turn grey.
- **Heating pump and fire without entities:** both follow the boiler supply temperature. The pump runs from
  `pump_on` °C, the fire is shown from `burning_on` °C, each with a hysteresis.
- **4-way valve** drawn as a quartered disc (like the BMW roundel) that turns with the valve position: the hot quarter
  joins the boiler supply with the heating supply when open and with the boiler return when closed. − / + change the
  position (`number`, `input_number`, `cover`, `valve`); a `sensor` is shown read-only. Quick repeated clicks are sent
  as one call.
- **Hot water tank** lying horizontally, coloured from the coil inlet (heating supply) to the outlet (heating return).
  Its zone valve: open = water flows through the coil, closed = the hot water branch is grey. A `switch` /
  `input_boolean` / `valve` is toggled with the ON/OFF button; a `binary_sensor` is read-only. The electric heater
  glows while it is on.
- **Photovoltaics:** panels on the roof, the sun and two horizontal bars with the power of two inverters (each with
  its own label) and the total below. The sun beams move towards the panels, faster with more power. W, kW and MW
  sensors are all shown in kW.
- **Grid:** a power pole with a line to the house. Dashes run to the house while importing (red) and back to the pole
  while exporting (green), faster with more power. `grid_invert: true` flips the direction.
- **Weather icon** follows the condition of a `weather` entity (sun, moon at night, clouds, rain, snow, storm, fog,
  wind).
- **Thermostat setpoint** with − / + (`climate` or `number`), optional.
- Click a value to open the more-info dialog of its entity. Elements whose entity is not set are hidden.
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
pv1_name: Falownik 1     # label of the first inverter (default "Falownik 1" / "Inverter 1")
pv2_name: Falownik 2
grid_invert: false       # true when the grid sensor reports export as positive
pv1_max: 10              # kW at which the inverter bar is full (default 10)
pv2_max: 10
pump_on: 40              # °C boiler supply at which the heating pump starts (default 40)
pump_hysteresis: 2       # pump stops below pump_on - hysteresis (default 2)
burning_on: 45           # °C boiler supply from which the boiler is shown as burning (default 45)
burning_hysteresis: 2    # default 2
min_temp: 20             # colour scale (default 20..80 °C)
max_temp: 80
valve_step: 5            # % per − / + click on the 4-way valve (default 5)
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
