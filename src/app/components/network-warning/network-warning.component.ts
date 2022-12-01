import { Component, OnInit } from '@angular/core';
import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-network-warning',
  templateUrl: './network-warning.component.html',
  styleUrls: ['./network-warning.component.scss']
})
export class NetworkWarningComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService) {
  }

  ngOnInit(): void {

  }

  getClosedState() {
    return !this.drugstoneConfig.gettingNetworkIssue;
  }

}
