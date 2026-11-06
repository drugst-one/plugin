import {CommonModule} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {NetworkLegendComponent} from './network-legend.component';
import {DrugstoneConfigService} from '../../../services/drugstone-config/drugstone-config.service';
import {LegendService} from '../../../services/legend-service/legend-service.service';
import {NetworkHandlerService} from '../../../services/network-handler/network-handler.service';
import {AnalysisService} from '../../../services/analysis/analysis.service';

describe('NetworkLegendComponent task configurations', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NetworkLegendComponent],
      imports: [CommonModule],
      providers: [
        DrugstoneConfigService,
        {provide: LegendService, useValue: {}},
        {provide: NetworkHandlerService, useValue: {activeNetwork: {nodeGroupsWithExpression: new Set(), currentViewNodes: []}}},
        {provide: AnalysisService, useValue: {}}
      ]
    }).compileComponents();
  });

  it('renders the default legend when a task config has no legendUrl', () => {
    const fixture = TestBed.createComponent(NetworkLegendComponent);
    const config = TestBed.inject(DrugstoneConfigService);
    config.set_analysisConfig({identifier: 'symbol', reviewed: false, nodeGroups: {}}, 'task');
    fixture.componentInstance.config = config.currentConfig();
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('.legend-table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    fixture.destroy();
  });

  it('renders a custom legend when an explicit URL exists', () => {
    const fixture = TestBed.createComponent(NetworkLegendComponent);
    const config = TestBed.inject(DrugstoneConfigService);
    config.set_analysisConfig({legendUrl: 'legend.svg'}, 'task');
    fixture.componentInstance.config = config.currentConfig();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('legend.svg');
    expect(fixture.nativeElement.querySelector('.legend-table')).toBeNull();
    fixture.destroy();
  });
});
