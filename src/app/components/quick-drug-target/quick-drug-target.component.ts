import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {AnalysisService} from 'src/app/services/analysis/analysis.service';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-quick-drug-target',
  templateUrl: './quick-drug-target.component.html',
  styleUrls: ['./quick-drug-target.component.scss']
})
export class QuickDrugTargetComponent implements OnInit {
  @Output()
  public taskEvent = new EventEmitter<object>();

  constructor(
    public drugstoneConfig: DrugstoneConfigService,
    public analysis: AnalysisService) {
  }

  public collapseQuickConnect = false;

  ngOnInit(): void {
  }

  public async runQuickAnalysis(isSuper, algorithm) {
    const object = await this.analysis.startQuickAnalysis(isSuper, algorithm);
    this.taskEvent.emit(object);
  }

}
