import {Component, Input, OnInit} from '@angular/core';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-external-analysis-button',
  templateUrl: './external-analysis-button.component.html',
  styleUrls: ['./external-analysis-button.component.scss']
})
export class ExternalAnalysisButtonComponent implements OnInit {

  @Input() enabled: boolean;
  @Input() callback: () => void;
  @Input() hidden: boolean;
  @Input() label: string;
  @Input() tooltipEnabled: string;
  @Input() tooltipDisabled: string;

  constructor(public analysis: AnalysisService,
              public drugstoneConfig: DrugstoneConfigService) {
  }

  ngOnInit(): void {
  }

}
