import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-quick-drug',
  templateUrl: './quick-drug.component.html',
  styleUrls: ['./quick-drug.component.scss']
})
export class QuickDrugComponent implements OnInit {
  @Output()
  public taskEvent = new EventEmitter<object>();

  constructor(
    public drugstoneConfig: DrugstoneConfigService,
    public analysis: AnalysisService) { }

  public collapseAnalysisQuick = false;

  ngOnInit(): void {
  }

  public async runQuickAnalysis(isSuper, algorithm) {
    const object = await this.analysis.startQuickAnalysis(isSuper, algorithm);
    this.taskEvent.emit(object);
  }
}
