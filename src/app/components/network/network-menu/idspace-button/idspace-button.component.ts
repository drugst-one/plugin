import { Component, Input, OnInit } from '@angular/core';

import { Identifier } from 'src/app/config';

import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';



@Component({

  selector: 'app-idspace-button',

  templateUrl: './idspace-button.component.html',

  styleUrls: ['./idspace-button.component.scss']

})

export class IdspaceButtonComponent implements OnInit {



  constructor(public drugstoneConfig: DrugstoneConfigService, public networkHandler: NetworkHandlerService) { }



  public idspace: string;

  @Input() buttonId: string;



  ngOnInit(): void {

    if (this.drugstoneConfig.currentConfig().label){

      this.idspace = this.drugstoneConfig.currentConfig().label;

    }

  }



  public changeLabel(idspace: Identifier){

    this.idspace = idspace;

    this.networkHandler.activeNetwork.updateLabel(idspace);

    this.drugstoneConfig.currentConfig().label = idspace;

  } 

}

