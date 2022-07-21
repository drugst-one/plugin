import { Component, OnInit } from '@angular/core';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-quick-drug-target',
  templateUrl: './quick-drug-target.component.html',
  styleUrls: ['./quick-drug-target.component.scss']
})
export class QuickDrugTargetComponent implements OnInit {

  constructor(
    public drugstoneConfig: DrugstoneConfigService,
    public analysis: AnalysisService) { }

  public collapseQuickConnect = false;

  ngOnInit(): void {
  }

}
