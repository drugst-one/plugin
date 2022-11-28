import {Component, OnInit} from '@angular/core';
import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-group-warning',
  templateUrl: './group-warning.component.html',
  styleUrls: ['./group-warning.component.scss']
})
export class GroupWarningComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService) {
  }

  ngOnInit(): void {

  }

  getClosedState() {
    return this.drugstoneConfig.gettingNetworkIssue || !this.drugstoneConfig.groupIssue;
  }

  getGroupString() {
    let str = '';
    this.drugstoneConfig.groupIssueList.forEach(g => str += (g + ', '));
    return str.substring(0, str.length - 2);
  }

  close() {
    this.drugstoneConfig.groupIssue = false;
  }
}
