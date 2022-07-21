import { Component, OnInit } from '@angular/core';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-quick-drug',
  templateUrl: './quick-drug.component.html',
  styleUrls: ['./quick-drug.component.scss']
})
export class QuickDrugComponent implements OnInit {

  constructor(
    public drugstoneConfig: DrugstoneConfigService,
    public analysis: AnalysisService) { }

  public collapseAnalysisQuick = false;

  ngOnInit(): void {
  }
}
