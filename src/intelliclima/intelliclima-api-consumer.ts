import {
  createHash,
  randomUUID,
} from 'crypto';
import { Logger, PlatformConfig } from 'homebridge';
import axios from 'axios';
import { FCIC_CONFIG_SERVER_HTTP, FCIC_CONFIG_API_FOLDER_MONO } from '../settings';
import {
  IntelliClimaGetDeviceBody,
  IntelliClimaGetDeviceResponse,
  IntelliClimaGetHousesResponse,
  IntelliClimaLoginBody,
  IntelliClimaLoginResponse,
} from './intelliclima-types';
import { ThermostatAccesory, ThermostatStatusEnum } from '../accessories/ThermostatAccessory';

export class IntelliClimaAPIConsumer {

  private authToken?: string;
  private userId?: string;
  private houseId?: string;
  private deviceIds?: string[];

  constructor(
    private readonly log: Logger,
    private readonly config: PlatformConfig,
  ) { }

  async login(): Promise<void> {
    const username = this.config.username;
    const password = this.config.password;
    const hashedPassword = createHash('sha256').update(password).digest('hex');
    const apiUrl = this.generateReadUrl(`user/login/${username}/${hashedPassword}`);
    const loginBody: IntelliClimaLoginBody = {
      manufacturer: 'Homebridge',
      model: 'NodeJS',
      platform: 'IntelliClimaHomebridge',
      version: '1.0.0',
      serial: 'unknown',
      uuid: randomUUID().toUpperCase(),
      language: 'english',
    };
    try {
      this.log.info(`Login with Intelliclima user: ${username}`);
      this.log.debug(JSON.stringify(loginBody, null, 2));
      const loginResponse = (await axios.post(apiUrl, loginBody)).data as IntelliClimaLoginResponse;
      if (loginResponse.status !== 'OK') {
        this.log.error(`Invalid credentials while logging in with user: ${username}`);
        this.log.debug(JSON.stringify(loginResponse));
        return;
      }
      this.log.debug(JSON.stringify(loginResponse, null, 2));
      this.authToken = loginResponse.token;
      this.userId = loginResponse.id;
    } catch (error) {
      this.log.error(`Error while logging in with user: ${username}`);
      this.log.debug(JSON.stringify(error));
      return;
    }
    await this.setHouseAndDeviceIds();
  }

  async getDevices(): Promise<IntelliClimaGetDeviceResponse[]> {
    const devices: IntelliClimaGetDeviceResponse[] = [];
    for (const deviceId of this.deviceIds ?? []) {
      if (Number(deviceId) <= 0) {
        continue;
      }
      try {
        const getDeviceResponse = await this.getDevice(deviceId);
        devices.push(getDeviceResponse);
      } catch (error) {
        this.log.error(`Error while getting device: ${deviceId}`);
        this.log.debug(JSON.stringify(error));
      }
    }
    return devices;
  }

  async getDevice(deviceId: string): Promise<IntelliClimaGetDeviceResponse> {
    const apiUrl = this.generateReadUrl('sync/cronos380');
    const getDeviceBody: IntelliClimaGetDeviceBody = {
      IDs: deviceId,
      ECOs: '',
      includi_eco: true,
      includi_ledot: true,
    };
    this.log.debug('Obtaining Intelliclima device: ', deviceId);
    this.log.debug(JSON.stringify(getDeviceBody));
    const getDeviceResponse = (await axios.post(apiUrl, getDeviceBody)).data as IntelliClimaGetDeviceResponse;
    getDeviceResponse.data = getDeviceResponse.data.map(deviceData => {
      return {
        ...deviceData,
        model: JSON.parse(deviceData.model.toString()),
        config: JSON.parse(deviceData.config.toString()),
      };
    });
    this.log.debug(JSON.stringify(getDeviceResponse));
    return getDeviceResponse;
  }

  async setDeviceTargetTemperature(thermostat: ThermostatAccesory, temperature: number): Promise<void> {
    if (thermostat.model !== 'C800WiFi') {
      this.log.error(`Trying to update info for ${thermostat.model}.` +
        'As depending on model, the write end-point is different, only C800WiFi model is supported to update values at this moment.' +
        'Open and issue and share the log with your model or feel free to open a PR to add support for other models');
      return;
    }
    const modeValue = this.thermostatStatusEnumToIntelliClima(thermostat.handleTargetHeatingCoolingStateGet());
    const apiUrl = this.generateReadUrl('C800/scrivi/');
    const updateModeBody = {
      serial: thermostat.serialNumber,
      w_Tset_Tman: temperature,
      mode: modeValue,
    };
    this.log.info(`Changing temperature to ${temperature} for device: ${thermostat.name}`);
    this.log.debug(JSON.stringify(updateModeBody));
    try {
      const changeConfigResponse = (await axios.post(apiUrl, updateModeBody)).data;
      this.log.debug(JSON.stringify(changeConfigResponse));
      return;
    } catch (error) {
      this.log.error(`Error while changing temperature to ${temperature} for device: ${thermostat.name}`);
      this.log.debug(JSON.stringify(error));
    }
  }

  async changeMode(thermostat: ThermostatAccesory, mode: ThermostatStatusEnum): Promise<void> {
    if (thermostat.model !== 'C800WiFi') {
      this.log.error(`Trying to update info for ${thermostat.model}.` +
        'As depending on model, the write end-point is different, only C800WiFi model is supported to update values at this moment.' +
        'Open and issue and share the log with your model or feel free to open a PR to add support for other models');
      return;
    }
    const modeValue = this.thermostatStatusEnumToIntelliClima(mode);
    const apiUrl = this.generateReadUrl('C800/scrivi/');
    const updateModeBody = {
      serial: thermostat.serialNumber,
      mode: modeValue,
      w_Tset_Tman: thermostat.handleTargetTemperatureGet(),
    };
    this.log.info(`Changing mode to ${mode} for device: ${thermostat.name}`);
    this.log.debug(JSON.stringify(updateModeBody));
    try {
      const changeConfigResponse = (await axios.post(apiUrl, updateModeBody)).data;
      this.log.debug(JSON.stringify(changeConfigResponse));
      return;
    } catch (error) {
      this.log.error(`Error while changing mode to ${mode} for device: ${thermostat.name}`);
      this.log.debug(JSON.stringify(error));
    }
  }

  private async setHouseAndDeviceIds(): Promise<void> {
    try {
      const apiUrl = this.generateReadUrl(`casa/elenco2/${this.userId}`);
      const headers = {
        'Tokenid': this.userId,
        'Token': this.authToken,
      };
      this.log.info(`Obtaining Intelliclima house for user: ${this.userId}`);
      this.log.debug(JSON.stringify(headers));
      const getHousesResponse = (await axios.post(apiUrl, null, { headers })).data as IntelliClimaGetHousesResponse;
      this.log.debug(JSON.stringify(getHousesResponse));
      this.houseId = Object.keys(getHousesResponse.houses)[0];
      this.deviceIds = getHousesResponse.houses[this.houseId].map((device) => device.id);
    } catch (error) {
      this.log.error(`Error while getting houses for user: ${this.userId}`);
      console.error(error);
      this.log.debug(JSON.stringify(error));
      return;
    }
  }

  private generateReadUrl(path: string) {
    return `${FCIC_CONFIG_SERVER_HTTP}${FCIC_CONFIG_API_FOLDER_MONO}${path}`;
  }

  private thermostatStatusEnumToIntelliClima(status: ThermostatStatusEnum): number {
    if (status === ThermostatStatusEnum.OFF) {
      return 0;
    }
    if (status === ThermostatStatusEnum.HEAT) {
      return 1;
    }
    if (status === ThermostatStatusEnum.COOL) {
      return 0;
    }
    if (status === ThermostatStatusEnum.AUTO) {
      return 2;
    }
    return 0;
  }
}

