import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {NetworkComponent} from './network.component';
import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';
import {LegendService} from '../../services/legend-service/legend-service.service';
import {NetworkHandlerService} from '../../services/network-handler/network-handler.service';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {NetexControllerService} from '../../services/netex-controller/netex-controller.service';
import {OmnipathControllerService} from '../../services/omnipath-controller/omnipath-controller.service';
import {LoadingScreenService} from '../../services/loading-screen/loading-screen.service';
import {ToastService} from '../../services/toast/toast.service';
import {LoggerService} from '../../services/logger/logger.service';

describe('NetworkComponent input warning ownership', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule], declarations: [NetworkComponent], schemas: [NO_ERRORS_SCHEMA],
      providers: [DrugstoneConfigService,
        {provide: LegendService, useValue: {}},
        {provide: NetworkHandlerService, useValue: {networks: {}, activeNetwork: {networkType: 'explorer'}}},
        {provide: AnalysisService, useValue: {subscribeList: () => {}}},
        {provide: NetexControllerService, useValue: {getLatestVersion: () => Promise.resolve('test')}},
        {provide: OmnipathControllerService, useValue: {}}, {provide: LoadingScreenService, useValue: {}},
        {provide: ToastService, useValue: {}}, {provide: LoggerService, useValue: {}}]
    }).compileComponents();
  });

  for (const activeType of ['explorer', 'analysis'] as const) {
    it(`shows input warnings only once when ${activeType} is active`, () => {
      const handler = TestBed.inject(NetworkHandlerService);
      handler.activeNetwork.networkType = activeType;
      TestBed.inject(DrugstoneConfigService).gettingNetworkEmpty = true;
      const fixtures = ['explorer', 'analysis'].map(type => {
        const fixture = TestBed.createComponent(NetworkComponent);
        fixture.componentInstance.networkType = type as any;
        fixture.componentInstance.nodeData = {nodes: [], edges: []};
        fixture.detectChanges();
        return fixture;
      });
      const warnings = fixtures.reduce((n, f) => n + f.nativeElement.querySelectorAll('app-network-empty-warning').length, 0);
      expect(warnings).toBe(activeType === 'explorer' ? 1 : 0);
      fixtures.forEach(f => f.destroy());
    });
  }
});
