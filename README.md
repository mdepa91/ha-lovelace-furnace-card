# Furnace card

A Home Assistant Lovelace card that draws a boiler room: the boiler (CO), the 4-way mixing valve, the heating pump on
the hot side of the valve, the house radiators and the hot water tank (CWU) with its zone valve and electric heater.

- **Pipe colours follow the temperature** (20 °C blue → 80 °C red, configurable). Pipes with no flow turn grey.
- **Heating pump and fire without entities:** both follow the boiler supply temperature. The pump runs from
  `pump_on` °C, the fire is shown from `burning_on` °C, each with a hysteresis.
- **Hot water valve:** open = water flows through the tank coil, closed = the hot water branch is grey.
  A `switch` / `input_boolean` / `valve` is toggled with the ON/OFF button; a `binary_sensor` is read-only.
- **4-way valve position** with − / + (`number`, `input_number`, `cover`, `valve`); a `sensor` is shown read-only.
  Quick repeated clicks are sent as one call.
- **Thermostat setpoint** with − / + (`climate` or `number`), optional.
- Click a value to open the more-info dialog of its entity. Elements whose entity is not set are hidden.
- Polish and English (from the HA language, or `language:`), follows the HA theme, visual editor.

## Installation

Copy `furnace-card.js` to `config/www/` and add it under Settings → Dashboards → ⋮ → Resources as
`/local/furnace-card.js` (type *JavaScript module*). Reload the browser.

## Configuration

```yaml
type: custom:furnace-card
title: Kotłownia            # optional, "" hides the title
language: pl               # optional: pl | en
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
  valve: number.mixing_valve_position               # optional, 0..100 %
  thermostat: climate.house                         # optional
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

`test/index.html` renders three scenarios with a mocked `hass`. Open `test/index.html?test` to click through the
controls; the result (service calls, more-info events) is printed at the bottom of the page.
