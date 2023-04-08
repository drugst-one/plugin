import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';

@Component({
  selector: 'app-center-view',
  templateUrl: './center-view.component.html',
  styleUrls: ['./center-view.component.scss']
})
export class CenterViewComponent implements OnInit {



  constructor(public networkHandler: NetworkHandlerService, public drugstoneConfig: DrugstoneConfigService) { }

  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();

  ngOnInit(): void {
  }

  public fitNetwork() {
    this.networkHandler.activeNetwork.networkInternal.fit();
  }

  public fullReset() {
    this.resetEmitter.emit(true);
  }

}
