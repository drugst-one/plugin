import { Component, Input, OnInit } from '@angular/core';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';

@Component({
  selector: 'app-summary-node',
  templateUrl: './summary-node.component.html',
  styleUrls: ['./summary-node.component.scss']
})
export class SummaryNodeComponent implements OnInit {

  constructor(    
    public analysis: AnalysisService,
    public drugstoneConfig: DrugstoneConfigService,
    public netex: NetexControllerService,
    public networkHandler: NetworkHandlerService
    ) { }

  ngOnInit(): void {
  }

  collapseDetails = true;
}
