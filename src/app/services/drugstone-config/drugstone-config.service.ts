import {Injectable} from '@angular/core';
import {defaultConfig, IConfig} from '../../config';
import {Subject} from 'rxjs';

export type DrugstoneConfigChangeSource = 'task' | 'view' | 'global';

export interface DrugstoneConfigChange {
  source: DrugstoneConfigChangeSource;
  config: IConfig;
}

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
  public showBugreport = false;
  private configSource: DrugstoneConfigChangeSource = 'global';
  private readonly configChangeSubject = new Subject<DrugstoneConfigChange>();
  public readonly configChanges = this.configChangeSubject.asObservable();

  constructor() {
  }

  set_analysisConfig(config: IConfig, source: DrugstoneConfigChangeSource = this.configSource) {
    this.analysisConfig = config;
    this.configSource = source;
    this.configChangeSubject.next({source, config});
  }

  remove_analysisConfig() {
    this.analysisConfig = undefined;
    this.configSource = 'global';
    this.configChangeSubject.next({source: 'global', config: this.config});
  }

  currentConfig():IConfig {
    return this.analysisConfig ? this.analysisConfig : this.config;
  }

}
