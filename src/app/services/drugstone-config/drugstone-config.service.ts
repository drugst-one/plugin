import { Injectable } from '@angular/core';
import {defaultConfig, IConfig} from '../../config';

@Injectable({
  providedIn: 'root'
})
export class DrugstoneConfigService {

  public config: IConfig = JSON.parse(JSON.stringify(defaultConfig));
  public smallStyle = false;

  constructor() { }
}
