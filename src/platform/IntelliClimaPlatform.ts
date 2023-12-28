import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { IntelliClimaAPIConsumer } from '../intelliclima/intelliclima-api-consumer';
import { ThermostatAccesory } from '../accessories/ThermostatAccessory';
import { PLUGIN_NAME } from '../settings';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class IntelliClimaPlatform implements DynamicPlatformPlugin {

  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // only load if configured
    if (!this.config.username || !this.config.password) {
      log.warn(`No credentials configuration found for ${PLUGIN_NAME}`);
      return;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {

      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();


    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const intelliclimaAPIConsumer = new IntelliClimaAPIConsumer(
      this.log,
      this.config,
    );

    await intelliclimaAPIConsumer.login();
    const devices = await intelliclimaAPIConsumer.getDevices();

    for (const device of devices) {
      const thermostatInfo = ThermostatAccesory.mapIntelliClimaDeviceResponseToThermostatInfo(device);
      if (thermostatInfo.model !== 'C800WiFi') {
        this.log.warn(`Detected device with unsupported model ${thermostatInfo.model} named ${thermostatInfo.name}. Skipping...`);
        continue;
      }
      const thermostatAccessoryStatus = ThermostatAccesory.mapIntelliClimaDeviceResponseToThermostatAccesoryStatus(device);
      const thermostatAccessory = new ThermostatAccesory(
        thermostatInfo.id,
        thermostatInfo.model,
        thermostatInfo.serialNumber,
        thermostatInfo.name,
        thermostatAccessoryStatus.currentStatus,
        thermostatAccessoryStatus.currentTargetStatus,
        thermostatAccessoryStatus.currentTemperature,
        thermostatAccessoryStatus.targetTemperature,
        thermostatAccessoryStatus.currentHumidity,
        thermostatAccessoryStatus.temperatureDisplayUnits,
        this.log,
        this.config,
        this.api,
        intelliclimaAPIConsumer,
      );
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === thermostatAccessory.platformAccessoryId);
      thermostatAccessory.register(existingAccessory);
    }
  }
}
