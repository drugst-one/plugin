import { Component, OnInit } from '@angular/core';
import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-network-empty-warning',
  templateUrl: './network-empty-warning.component.html',
  styleUrls: ['./network-empty-warning.component.scss']
})
export class NetworkEmptyWarningComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService) {
  }

  ngOnInit(): void {
  }

  getClosedState() {
    return !this.drugstoneConfig.gettingNetworkEmpty;
  }

}
