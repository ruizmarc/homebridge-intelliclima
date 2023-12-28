<p align="center">
   <a href="https://github.com/ruizmarc/homebridge-intelliclima"><img alt="Homebridge IntelliClima" src="https://github.com/ruizmarc/homebridge-intelliclima/assets/5717082/267ea081-2be2-4712-bb89-48d750124f3f" width="600px"></a>
</p>

<span align="center">

# IntelliClima Homebridge

<!-- [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins) -->
[![npm](https://img.shields.io/npm/dt/homebridge-intelliclima
)](https://www.npmjs.com/package/homebridge-intelliclima)
[![npm](https://img.shields.io/npm/v/homebridge-intelliclima
)](https://www.npmjs.com/package/homebridge-intelliclima)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/ruizmarc/homebridge-intelliclima)](https://github.com/ruizmarc/homebridge-intelliclima/pulls)
[![GitHub issues](https://img.shields.io/github/issues/ruizmarc/homebridge-intelliclima)](https://github.com/ruizmarc/homebridge-intelliclima/issues)

Homebridge plugin for WiFi Thermostats manufactured by Fantini Cosmi and connected to IntelliClima. More devices can be added in the future if they are compatible with the IntelliClima API.

</span>

## Package Requirements

| Package | Installation | Role | Required |
| --- | --- | --- | --- |
| [Homebridge](https://github.com/homebridge/homebridge) | [Homebridge Wiki](https://github.com/homebridge/homebridge/wiki) | HomeKit Bridge | Required |
| [Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) | [Config UI X Wiki](https://github.com/oznu/homebridge-config-ui-x/wiki) | Homebridge Web User Interface | Recommended |
| [Homebridge IntelliClima](https://www.npmjs.com/package/homebridge-intelliclima) | [Plug-In README](https://github.com/ruizmarc/homebridge-intelliclima#readme) | Homebridge Plug-In | Required |

### About The Plugin

* All devices are detected automatically through IntelliClima API.
* Supports one house per account
* Supports Power `ON/OFF`.
* Supports Operating mode `POWER OFF/HEAT/COOL/AUTO`.
* Supports Temperature configuration for `HEATING`.
* Supports Temperature display units `Celsius ºC / Fahrenheit ºF`.
* Support Automations, Shortcuts and Siri.
* Support to add extra temperature for HomeKit automations.
* Support to add extra humidity for HomeKit automations.

### Configuration

* Run this plugin as a [Child Bridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges) (Highly Recommended), this prevent crash Homebridge if plugin crashes.
* Install and use [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x/wiki) to configure this plugin (Highly Recommended).
* Be sure to always make a backup copy of your config.json file before making any changes to it.

| Key | Description |
| --- | --- |
| `username` | The plugin needs to access IntelliClima API to interact with the device so it will be using your IntelliClima App credentials to authenticate. |
| `password` | Your password will not be shared, it will be only used it to authenticate with IntelliClima API. It is the same you use in your IntelliClima App |
| `temperatureSensor` | This enable extra temperature sensor to use with automations in HomeKit app |
| `humiditySensor` | This enables extra humidity sensor to use with automations in HomeKit app |

### Caveats

Fantini Cosmi do not provide any open/public API to interact with their devices. This plugin uses the same API that the official IntelliClima App uses and there is not documentation on how to interact with it, but just observing how the App behaves. This means that if Fantini Cosmi changes their API, this plugin might stop working.

Currently, this plugin fully supports C800WiFi thermostats as it is the device I own. If you have a different device a huge part of the plugin will probably work, but some features might be broken. If you have a different device and you want to add support for it, please open an issue and I will do my best to add support for it with your support to test the device.

IntelliClima Homebridge is a hobby project of mine, provided as-is, with no warranty whatsoever. I'm running it successfully at home since I created it, but your mileage might vary.
