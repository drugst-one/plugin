import {Type, Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NetworkComponent} from 'src/app/components/network/network.component';
import {NetworkType} from 'src/app/interfaces';
import {AnalysisService} from '../analysis/analysis.service';
import {DrugstoneConfigService} from '../drugstone-config/drugstone-config.service';
import {NetexControllerService} from '../netex-controller/netex-controller.service';
import {OmnipathControllerService} from '../omnipath-controller/omnipath-controller.service';
import {LegendService} from '../legend-service/legend-service.service';
import {LoadingScreenService} from '../loading-screen/loading-screen.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkHandlerService {

  constructor(public legendService: LegendService, public networkHandler: NetworkHandlerService, public analysis: AnalysisService, public drugstoneConfig: DrugstoneConfigService, public netex: NetexControllerService, public omnipath: OmnipathControllerService, public loadingScreen: LoadingScreenService) {
  }

  private change = new Subject<any>();
  public networkSidebarOpen = this.drugstoneConfig.config.expandNetworkMenu || false;
  public networks: { NetworkType: NetworkComponent } | {} = {};
  public activeNetwork: NetworkComponent = new NetworkComponent(this.legendService, this.networkHandler, this.analysis, this.drugstoneConfig, this.netex, this.omnipath, this.loadingScreen);

  public setActiveNetwork(network: NetworkType) {
    this.triggerChange();
    this.activeNetwork = this.networks[network];
  }

  public triggerChange() {
    this.change.next(true);
  }

  get getChange$() {
    return this.change.asObservable();
  }

  async updateAdjacentNodes(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      if (this.drugstoneConfig.config.activateNetworkMenuButtonAdjacentDrugs) {
        this.activeNetwork.adjacentDrugs = true;
        await this.activeNetwork.updateAdjacentDrugs(true);
      }
      if (this.drugstoneConfig.config.activateNetworkMenuButtonAdjacentDisorders) {
        this.activeNetwork.adjacentDisordersProtein = true;
        await this.activeNetwork.updateAdjacentProteinDisorders(true);
      }
      if (this.drugstoneConfig.config.activateNetworkMenuButtonAdjacentDisordersDrugs) {
        this.activeNetwork.adjacentDisordersDrug = true;
        await this.activeNetwork.updateAdjacentDrugDisorders(true);
      }
      resolve(true);
    });
  }
}
