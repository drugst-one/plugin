import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {SummaryNodeComponent} from './summary-node.component';
import {DrugstoneConfigService} from '../../../../services/drugstone-config/drugstone-config.service';
import {AnalysisService} from '../../../../services/analysis/analysis.service';
import {NetexControllerService} from '../../../../services/netex-controller/netex-controller.service';
import {NetworkHandlerService} from '../../../../services/network-handler/network-handler.service';

describe('SummaryNodeComponent for externally created tasks', () => {
  it('opens node details using inherited group definitions', async () => {
    const wrapper = {id: 'A1BG', data: {id: 'A1BG', group: 'seedNode'}};
    await TestBed.configureTestingModule({
      imports: [CommonModule], declarations: [SummaryNodeComponent], schemas: [NO_ERRORS_SCHEMA],
      providers: [DrugstoneConfigService,
        {provide: AnalysisService, useValue: {}}, {provide: NetexControllerService, useValue: {}},
        {provide: NetworkHandlerService, useValue: {activeNetwork: {selectedWrapper: wrapper}}}]
    }).compileComponents();
    TestBed.inject(DrugstoneConfigService).set_analysisConfig({nodeGroups: {}}, 'task');
    const fixture = TestBed.createComponent(SummaryNodeComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.textContent).toContain('Seed Nodes');
    expect(fixture.nativeElement.querySelector('app-info-tile').wrapper).toBe(wrapper);
    fixture.destroy();
  });
});
