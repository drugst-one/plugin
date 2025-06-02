import { Component, OnInit } from '@angular/core';

import { AnalysisService } from 'src/app/services/analysis/analysis.service';

import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';

import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';



@Component({

  selector: 'app-network-overview',

  templateUrl: './network-overview.component.html',

  styleUrls: ['./network-overview.component.scss']

})

export class NetworkOverviewComponent implements OnInit {



  constructor(    

    public analysis: AnalysisService,

    public drugstoneConfig: DrugstoneConfigService,

    public netex: NetexControllerService,

    public networkHandler: NetworkHandlerService

    ) { }



  ngOnInit(): void {

  }



  collapseOverview = this.drugstoneConfig.config.showOverview;



}

