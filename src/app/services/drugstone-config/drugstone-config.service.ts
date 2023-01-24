import {Injectable} from '@angular/core';
import {defaultConfig, IConfig} from '../../config';

@Injectable({
  providedIn: 'root'
})
export class DrugstoneConfigService {

  public config: IConfig = JSON.parse(JSON.stringify(defaultConfig));
  public analysisConfig: IConfig = undefined;
  public parsingIssueConfig = false;
  public parsingIssueNetwork = false;
  public parsingIssueGroups = false;
  public gettingNetworkIssue = true;
  public gettingNetworkEmpty = false;
  public groupIssue = false;
  public groupIssueList = [];
  public smallStyle = false;

  public showLicense = false;

  constructor() {
  }

  set_analysisConfig(config) {
    this.analysisConfig = config;
  }

  remove_analysisConfig() {
    this.analysisConfig = undefined;
  }

  currentConfig():IConfig {
    return this.analysisConfig ? this.analysisConfig : this.config;
  }

}
