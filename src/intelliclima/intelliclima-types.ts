export interface IntelliClimaLoginBody {
  manufacturer: string;
  model: string;
  platform: string;
  serial: string;
  uuid: string;
  version: string;
  language: string;
}

export interface IntelliClimaLoginResponse {
  id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  surname: string;
  last_connection: string;
  creation_date: string;
  admin: string;
  token: string;
  reqid: string;
  version: string;
  status: string;
  error: string;
  user_devices: string;
  query: string;
}

export interface IntelliClimaGetHousesResponse {
  status: 'OK' | 'NO_AUTH';
  houses: {
    [houseId: string]: IntelliClimaHouseDevices[];
  };
  hasHouses: boolean;
  hasMulti: boolean;
  cronoIDs: string[];
  masterIDs: string[];
  ecoIDs: string[];
  ecoMasterIDs: string[];
}

export interface IntelliClimaHouseDevices {
  id: string;
  isMaster: boolean;
  name: string;
  tipo: string;
}

export interface IntelliClimaGetDeviceBody {
  IDs: string;
  ECOs: string;
  includi_eco: boolean;
  includi_ledot: boolean;
}

export interface IntelliClimaGetDeviceResponse {
  status: 'OK';
  data: IntelliClimaDevice[];
  IDs: string;
  ECOs: string;
  includi_eco: boolean;
  includi_ledot: boolean;
  elencoEcosUtente: unknown[];
}

export interface IntelliClimaDevice {
  id: string;
  crono_sn: string;
  multi_sn: string;
  zone: string;
  status: string;
  online: string;
  action: string;
  model: {
    modello: string;
    tipo: string;
  };
  name: string;
  config: {
    mode: string;
    serial: string;
  };
  appdata: string;
  programs: string;
  last_online: string;
  creation_date: string;
  agc_on: string;
  cooler_on: string;
  houses_id: string;
  image: string;
  c_mode: string;
  t_amb: string;
  t1w: string;
  t2w: string;
  t3w: string;
  t1s: string;
  t2s: string;
  t3s: string;
  jtw: string;
  jts: string;
  jh: string;
  jm: string;
  jdate: string;
  tmans: string;
  tmanw: string;
  tafrost: string;
  tset: string;
  relay: string;
  relayrh: string;
  rh: string;
  rhset: string;
  rhrele: string;
  rhabl: string;
  ws: string;
  day: string;
  auxio: string;
  alarms: string;
  lastprogramwinter: string;
  lastprogramsummer: string;
  upd_client: string;
  upd_server: string;
  check_mode: string;
  zones_id: string;
  zones_crono_sn: string;
  programs_acs: string;
  power_detect: string;
  manut_installatore: string;
  manut_manutentore: string;
  manut_pros_manutenzione: string;
  manut_pros_verifica: string;
  version: string;
  protocol_type: string;
  esp_at_version: string;
  display_time_on: string;
  brightness: string;
  rgb_led: string;
  degree: string;
  adjust_temperature: string;
  differential: string;
  summertime: string;
  timezone: string;
  communication_frequency: string;
  power_safe_enable: string;
  optimization_function: string;
  window_detection_enable: string;
  home_page_visualization: string;
  dhw_block: string;
  password: string;
  limit_setpoint_min: string;
  limit_setpoint_max: string;
  limit_ch_max: string;
  limit_ch_min: string;
  limit_dhw_max: string;
  limit_dhw_min: string;
  kd_slope: string;
  kd_external_probe: string;
  max_ch_heating_curve: string;
  min_ch_heating_curve: string;
  max_outside_heating_curve: string;
  min_outside_heating_curve: string;
  end_jolly_year: string;
  end_jolly_month: string;
  end_jolly_day: string;
  end_jolly_week_day: string;
  end_jolly_hours: string;
  end_jolly_minutes: string;
  end_jolly_seconds: string;
  dhw_enable: string;
  hvac_mode: string;
  modulation_type: string;
  ch_temperature_setting: string;
  dhw_temperature_setting: string;
  setpoints_dhw_winter_economy: string;
  setpoints_dhw_winter_comfort: string;
  window_detection_state: string;
  battery_voltage: string;
  battery_state: string;
  wallplate_detect: string;
  last_communication_year: string;
  last_communication_month: string;
  last_communication_day: string;
  last_communication_week_day: string;
  last_communication_hours: string;
  last_communication_minutes: string;
  last_communication_seconds: string;
  last_comm: string;
  next_comm: string;
  wifi_last_comm_quality: string;
  anomaly: string;
  stato_upgrade_fw: string;
  jolly_year_left: string;
  jolly_month_left: string;
  jolly_day_left: string;
  jolly_week_left: string;
  jolly_hours_left: string;
  jolly_minutes_left: string;
  jolly_seconds_left: string;
  current_day: string;
  current_month: string;
  current_year: string;
  t_high: string;
  t_low: string;
  usage: string;
  usage_month_curr: string;
  usage_month_prev: string;
  usage_year: string;
  anomalie_tacit_hours: string;
  anomalie_tacit_actives: string;
  kd_slope_2: string;
  ch_setpoint_with_climatic_curve: string;
  ch_temperature_out: string;
  ch_temperature_in: string;
  dhw_temperature_out: string;
  fume_temperature: string;
  outside_temperature: string;
  thermal_sys_pressure: string;
  power_percentage: string;
  ot_field_validity: string;
  current_setpoint_dhw: string;
  heating_system: string;
  wifi_ssid: string;
  dhw_min: string;
  dhw_max: string;
  onoff_opentherm: string;
  download_fw_percentage: string;
  ch_min: string;
  ch_max: string;
  multizona: string[];
}
