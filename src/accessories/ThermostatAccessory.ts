import { API, Characteristic, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import { IntelliClimaAPIConsumer } from '../intelliclima/intelliclima-api-consumer';
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';
import { IntelliClimaGetDeviceResponse } from '../intelliclima/intelliclima-types';

export enum ThermostatStatusEnum {
  OFF = 0,
  HEAT = 1,
  COOL = 2,
  AUTO = 3
}

interface ThermostatAccesoryStatus {
  currentStatus: ThermostatStatusEnum;
  currentTargetStatus: ThermostatStatusEnum;
  currentTemperature: number;
  targetTemperature: number;
  currentHumidity: number;
  temperatureDisplayUnits: 'CELSIUS' | 'FAHRENHEIT';
}

interface ThermostatInfo {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
}

export class ThermostatAccesory {

  public static intelliClimaStatusToAccessoryStatus(mode: number | string): ThermostatStatusEnum {
    // C800 0 = CH 4 (off)
    // C800 1 = CH 0 (man)
    // C800 2 = CH 1 (auto)
    mode = mode.toString();
    if (mode === '0') {
      return ThermostatStatusEnum.OFF;
    }
    if (mode === '1') {
      return ThermostatStatusEnum.HEAT;
    }
    if (mode === '2') {
      return ThermostatStatusEnum.AUTO;
    }
    return ThermostatStatusEnum.OFF;
  }

  public static mapIntelliClimaDeviceResponseToThermostatAccesoryStatus(device: IntelliClimaGetDeviceResponse): ThermostatAccesoryStatus {
    const deviceData = device.data[0];
    return {
      currentStatus: ThermostatAccesory.intelliClimaStatusToAccessoryStatus(deviceData.c_mode),
      currentTargetStatus: ThermostatAccesory.intelliClimaStatusToAccessoryStatus(deviceData.config.mode ?? deviceData.c_mode),
      currentTemperature: Number(deviceData.t_amb),
      targetTemperature: Number(deviceData.tmanw),
      currentHumidity: Number(deviceData.rh),
      temperatureDisplayUnits: 'CELSIUS',
    };
  }

  public static mapIntelliClimaDeviceResponseToThermostatInfo(device: IntelliClimaGetDeviceResponse): ThermostatInfo {
    const deviceData = device.data[0];
    return {
      id: deviceData.id,
      name: deviceData.name,
      model: deviceData.model.modello,
      serialNumber: deviceData.crono_sn,
    };
  }

  public static fromCelsiusToFahrenheit(celsius: number): number {
    return ((celsius * 1.8) + 32);
  }

  public static fromFahrenheitToCelsius(fahrenheit: number): number {
    return ((fahrenheit - 32) / 1.8);
  }

  get platformAccessoryId(): string {
    return this.platformAccessory?.UUID ?? this.api.hap.uuid.generate(this.id);
  }

  private readonly Service: typeof Service = this.api.hap.Service;
  private readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  private platformAccessory?: PlatformAccessory;
  private thermostatService?: Service;
  private temperatureSensorService?: Service;
  private humiditySensorService?: Service;

  private subscriptionInterval?: NodeJS.Timeout;

  constructor(
    public readonly id: string,
    public readonly model: string,
    public readonly serialNumber: string,
    public readonly name: string,
    private currentStatus: ThermostatStatusEnum,
    private targetStatus: ThermostatStatusEnum,
    private currentTemperature: number,
    private targetTemperature: number,
    private currentHumidity: number,
    private temperatureDisplayUnits: 'CELSIUS' | 'FAHRENHEIT',
    private readonly log: Logger,
    private readonly config: PlatformConfig,
    private readonly api: API,
    private readonly intelliclimaAPIConsumer: IntelliClimaAPIConsumer,
  ) {
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
  }

  async sync() {
    this.log.debug('Syncing accessory: ', this.name);
    try {
      const device = await this.intelliclimaAPIConsumer.getDevice(this.id);
      const mappedDevice = ThermostatAccesory.mapIntelliClimaDeviceResponseToThermostatAccesoryStatus(device);
      this.currentStatus = mappedDevice.currentStatus;
      this.targetStatus = mappedDevice.currentTargetStatus;
      this.currentTemperature = mappedDevice.currentTemperature;
      this.targetTemperature = mappedDevice.targetTemperature;
      this.currentHumidity = mappedDevice.currentHumidity;
      this.temperatureDisplayUnits = mappedDevice.temperatureDisplayUnits;
      this.log.debug(JSON.stringify(mappedDevice, null, 2));
    } catch (error) {
      this.log.error(`Error while syncing accessory: ${this.name}`);
      this.log.debug(JSON.stringify(error, null, 2));
    }
  }

  register(platformAccessory?: PlatformAccessory) {

    if (!this.platformAccessory && !platformAccessory) {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', this.name);

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      // create a new accessory
      this.platformAccessory = new this.api.platformAccessory(this.name, this.platformAccessoryId);

      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      // accessory.context.device = this;

      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [this.platformAccessory]);
    } else if (platformAccessory) {
      this.platformAccessory = platformAccessory;
    }

    this.registerService();

  }

  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
  handleCurrentHeatingCoolingStateGet() {
    this.log.debug('Triggered GET CurrentHeatingCoolingState');
    if (this.currentStatus === ThermostatStatusEnum.OFF) {
      return this.Characteristic.CurrentHeatingCoolingState.OFF;
    }
    if (this.currentStatus === ThermostatStatusEnum.HEAT) {
      return this.Characteristic.CurrentHeatingCoolingState.HEAT;
    }
    if (this.currentStatus === ThermostatStatusEnum.COOL) {
      return this.Characteristic.CurrentHeatingCoolingState.COOL;
    }
    if (this.currentStatus === ThermostatStatusEnum.AUTO) {
      return this.Characteristic.CurrentHeatingCoolingState.HEAT;
    }
    return this.Characteristic.CurrentHeatingCoolingState.OFF;
  }


  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateGet() {
    this.log.debug('Triggered GET TargetHeatingCoolingState');
    if (this.targetStatus === ThermostatStatusEnum.OFF) {
      return this.Characteristic.CurrentHeatingCoolingState.OFF;
    }
    if (this.targetStatus === ThermostatStatusEnum.HEAT) {
      return this.Characteristic.CurrentHeatingCoolingState.HEAT;
    }
    if (this.targetStatus === ThermostatStatusEnum.COOL) {
      return this.Characteristic.CurrentHeatingCoolingState.COOL;
    }
    if (this.targetStatus === ThermostatStatusEnum.AUTO) {
      return this.Characteristic.CurrentHeatingCoolingState.HEAT;
    }
    return this.Characteristic.CurrentHeatingCoolingState.OFF;
  }

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
  async handleTargetHeatingCoolingStateSet(value) {
    this.log.debug('Triggered SET TargetHeatingCoolingState:', value);
    await this.intelliclimaAPIConsumer.changeMode(this, value);
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleCurrentTemperatureGet() {
    this.log.debug('Triggered GET CurrentTemperature');
    return this.temperatureDisplayUnits === 'CELSIUS' ? this.currentTemperature : ThermostatAccesory.fromCelsiusToFahrenheit(this.currentTemperature);
  }

  /**
 * Handle requests to get the current value of the "Current Humidity" characteristic
 */
  handleCurrentRelativeHumidity() {
    this.log.debug('Triggered GET CurrentRelativeHumidity');
    return this.currentHumidity;
  }


  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  handleTargetTemperatureGet() {
    this.log.debug('Triggered GET TargetTemperature');
    return this.temperatureDisplayUnits === 'CELSIUS' ? this.targetTemperature : ThermostatAccesory.fromCelsiusToFahrenheit(this.targetTemperature);
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  async handleTargetTemperatureSet(value) {
    const actualTemperature = this.temperatureDisplayUnits === 'CELSIUS' ? value : ThermostatAccesory.fromFahrenheitToCelsius(value);
    this.log.debug('Triggered SET TargetTemperature:', actualTemperature);
    await this.intelliclimaAPIConsumer.setDeviceTargetTemperature(this, actualTemperature);
  }

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsGet() {
    this.log.debug('Triggered GET TemperatureDisplayUnits');
    if (this.temperatureDisplayUnits === 'CELSIUS') {
      return this.Characteristic.TemperatureDisplayUnits.CELSIUS;
    }
    if (this.temperatureDisplayUnits === 'FAHRENHEIT') {
      return this.Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
    }
    return this.Characteristic.TemperatureDisplayUnits.CELSIUS;
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsSet(value) {
    this.log.debug('Triggered SET TemperatureDisplayUnits:', value);
    if (value === this.Characteristic.TemperatureDisplayUnits.CELSIUS) {
      this.temperatureDisplayUnits = 'CELSIUS';
    } if (value === this.Characteristic.TemperatureDisplayUnits.FAHRENHEIT) {
      this.temperatureDisplayUnits = 'FAHRENHEIT';
    }
  }

  private registerService() {

    this.log.info('Initializing thermostat:', this.name);

    this.thermostatService = this.platformAccessory?.getService(this.Service.Thermostat) ||
      this.platformAccessory?.addService(this.Service.Thermostat);

    // set accessory information
    this.platformAccessory?.getService(this.Service.AccessoryInformation)!
      .setCharacteristic(this.Characteristic.Manufacturer, 'Fantini Cosmi')
      .setCharacteristic(this.Characteristic.Model, this.model)
      .setCharacteristic(this.Characteristic.SerialNumber, this.serialNumber);

    this.thermostatService?.setCharacteristic(this.Characteristic.Name, this.name);

    this.thermostatService?.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
      .onGet(this.handleCurrentHeatingCoolingStateGet.bind(this));

    this.thermostatService?.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .onGet(this.handleTargetHeatingCoolingStateGet.bind(this))
      .onSet(this.handleTargetHeatingCoolingStateSet.bind(this));

    this.thermostatService?.getCharacteristic(this.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));

    this.thermostatService?.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleCurrentRelativeHumidity.bind(this));

    this.thermostatService?.getCharacteristic(this.Characteristic.TargetTemperature)
      .onGet(this.handleTargetTemperatureGet.bind(this))
      .onSet(this.handleTargetTemperatureSet.bind(this));

    this.thermostatService?.getCharacteristic(this.Characteristic.TemperatureDisplayUnits)
      .onGet(this.handleTemperatureDisplayUnitsGet.bind(this))
      .onSet(this.handleTemperatureDisplayUnitsSet.bind(this));

    if (this.config.temperatureSensor) {
      this.log.info('Initializing temperature sensor:', this.name);
      this.temperatureSensorService = this.platformAccessory?.getService(this.Service.TemperatureSensor) ||
        this.platformAccessory?.addService(this.Service.TemperatureSensor);
      this.temperatureSensorService?.setCharacteristic(this.Characteristic.Name, `${this.name} Temperature Sensor`);
      this.temperatureSensorService?.getCharacteristic(this.Characteristic.CurrentTemperature)
        .onGet(this.handleCurrentTemperatureGet.bind(this));
    }

    if (this.config.humiditySensor) {
      this.log.info('Initializing humidity sensor:', this.name);
      this.humiditySensorService = this.platformAccessory?.getService(this.Service.HumiditySensor) ||
        this.platformAccessory?.addService(this.Service.HumiditySensor);
      this.humiditySensorService?.setCharacteristic(this.Characteristic.Name, `${this.name} Humidity Sensor`);
      this.humiditySensorService?.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
        .onGet(this.handleCurrentRelativeHumidity.bind(this));
    }

    this.subscribeToChanges();

  }

  subscribeToChanges() {
    let prevHumidity = this.currentHumidity;
    let prevTemperature = this.currentTemperature;
    let prevTargetTemperature = this.targetTemperature;
    let prevStatus = this.currentStatus;
    let prevTargetStatus = this.targetStatus;

    if (this.subscriptionInterval) {
      clearInterval(this.subscriptionInterval);
    }

    this.subscriptionInterval = setInterval(async () => {
      await this.sync();
      if (this.currentStatus !== prevStatus) {
        this.log.info(`Updating ${this.name} CurrentHeatingCoolingState to ${this.currentStatus} from ${prevStatus}`);
        this.thermostatService?.updateCharacteristic(this.Characteristic.CurrentHeatingCoolingState, this.currentStatus);
        prevStatus = this.currentStatus;
      }
      if (this.targetStatus !== prevTargetStatus) {
        this.log.info(`Updating ${this.name} TargetHeatingCoolingState to ${this.targetStatus} from ${prevTargetStatus}`);
        this.thermostatService?.updateCharacteristic(this.Characteristic.TargetHeatingCoolingState, this.targetStatus);
        prevTargetStatus = this.targetStatus;
      }
      if (this.currentHumidity !== prevHumidity) {
        this.log.info(`Updating ${this.name} CurrentRelativeHumidity to ${this.currentHumidity} from ${prevHumidity}`);
        this.thermostatService?.updateCharacteristic(this.Characteristic.CurrentRelativeHumidity, this.currentHumidity);
        this.humiditySensorService?.updateCharacteristic(this.Characteristic.CurrentRelativeHumidity, this.currentHumidity);
        prevHumidity = this.currentHumidity;
      }
      if (this.currentTemperature !== prevTemperature) {
        const actualTemperature = this.temperatureDisplayUnits === 'CELSIUS' ? this.currentTemperature : ThermostatAccesory.fromCelsiusToFahrenheit(this.currentTemperature);
        const actualPrevTemperature = this.temperatureDisplayUnits === 'CELSIUS' ? prevTemperature : ThermostatAccesory.fromCelsiusToFahrenheit(prevTemperature);
        this.log.info(`Updating ${this.name} CurrentTemperature to ${actualTemperature} from ${actualPrevTemperature}`);
        this.thermostatService?.updateCharacteristic(this.Characteristic.CurrentTemperature, actualTemperature);
        this.temperatureSensorService?.updateCharacteristic(this.Characteristic.CurrentTemperature, actualTemperature);
        prevTemperature = this.currentTemperature;
      }
      if (this.targetTemperature !== prevTargetTemperature) {
        const actualTargetTemperature = this.temperatureDisplayUnits === 'CELSIUS' ? this.targetTemperature : ThermostatAccesory.fromCelsiusToFahrenheit(this.targetTemperature);
        const actualPrevTargetTemperature = this.temperatureDisplayUnits === 'CELSIUS' ? prevTargetTemperature : ThermostatAccesory.fromCelsiusToFahrenheit(prevTargetTemperature);
        this.log.info(`Updating ${this.name} TargetTemperature to ${actualTargetTemperature} from ${actualPrevTargetTemperature}`);
        this.thermostatService?.updateCharacteristic(this.Characteristic.TargetTemperature, actualTargetTemperature);
        prevTargetTemperature = this.targetTemperature;
      }
    }, 5000);
  }

}
