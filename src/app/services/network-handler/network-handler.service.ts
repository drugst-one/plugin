import { Type, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NetworkComponent } from 'src/app/components/network/network.component';
import { NetworkType } from 'src/app/interfaces';
import { AnalysisService } from '../analysis/analysis.service';
import { DrugstoneConfigService } from '../drugstone-config/drugstone-config.service';
import { NetexControllerService } from '../netex-controller/netex-controller.service';
import { OmnipathControllerService } from '../omnipath-controller/omnipath-controller.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkHandlerService {

  constructor(public networkHandler: NetworkHandlerService, public analysis: AnalysisService, public drugstoneConfig: DrugstoneConfigService, public netex: NetexControllerService, public omnipath: OmnipathControllerService) { }

  private change = new Subject<any>();

  public networks: {NetworkType: NetworkComponent} | {} = {};
  public activeNetwork: NetworkComponent = new NetworkComponent(this.networkHandler, this.analysis, this.drugstoneConfig, this.netex, this.omnipath);

  public setActiveNetwork(network: NetworkType) {
    this.triggerChange();
    this.activeNetwork = this.networks[network];
  }

  public triggerChange() {
    this.change.next(true);
  }

  get getChange$ () {
    return this.change.asObservable();
  }
}
