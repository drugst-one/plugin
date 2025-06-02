import {Component, EventEmitter, OnInit, Output} from '@angular/core';

import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';



@Component({

  selector: 'app-network-menu-left',

  templateUrl: './network-menu-left.component.html',

  styleUrls: ['./network-menu-left.component.scss']

})

export class NetworkMenuLeftComponent implements OnInit {



  constructor(public drugstoneConfig: DrugstoneConfigService, public networkHandler: NetworkHandlerService) { }



  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();



  ngOnInit(): void {

  }



  public reset() {

    this.resetEmitter.emit(true);

  }

}

