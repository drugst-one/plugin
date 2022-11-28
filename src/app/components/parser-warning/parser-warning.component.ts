import {Component, OnInit} from '@angular/core';
import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-parser-warning',
  templateUrl: './parser-warning.component.html',
  styleUrls: ['./parser-warning.component.scss']
})
export class ParserWarningComponent implements OnInit {
  constructor(public drugstoneConfig: DrugstoneConfigService) {
  }

  ngOnInit(): void {

  }

  getClosedState() {
    return this.drugstoneConfig.groupIssue || !(this.drugstoneConfig.parsingIssueGroups || this.drugstoneConfig.parsingIssueConfig || this.drugstoneConfig.parsingIssueNetwork);
  }

  getConfigs() {
    let out = '';
    if (this.drugstoneConfig.parsingIssueNetwork) {
      out += 'network, ';
    }
    if (this.drugstoneConfig.parsingIssueConfig) {
      out += 'config, ';
    }
    if (this.drugstoneConfig.parsingIssueGroups) {
      out += 'groups, ';
    }
    return out.substring(0, out.length - 2);
  }

  close() {
    this.drugstoneConfig.parsingIssueConfig = false;
    this.drugstoneConfig.parsingIssueGroups = false;
  }

}
