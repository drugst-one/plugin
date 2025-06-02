import {Component, EventEmitter, OnInit, Output} from '@angular/core';

import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';



@Component({

  selector: 'app-center-view-inverse',

  templateUrl: './center-view-inverse.component.html',

  styleUrls: ['./center-view-inverse.component.scss']

})

export class CenterViewInverseComponent implements OnInit {



  constructor(public networkHandler: NetworkHandlerService, public drugstoneConfig: DrugstoneConfigService) { }



  ngOnInit(): void {

  }



  public fitNetwork() {

    this.networkHandler.activeNetwork.networkInternal.fit();

  }



  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();



  public fullReset() {

    this.resetEmitter.emit(true);

  }

}

