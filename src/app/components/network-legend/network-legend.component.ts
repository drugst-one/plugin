import {Component, Input, OnInit} from '@angular/core';
import { legendContext } from 'src/app/interfaces';
import {IConfig} from '../../config';

@Component({
  selector: 'app-network-legend',
  templateUrl: './network-legend.component.html',
  styleUrls: ['./network-legend.component.scss']
})
export class NetworkLegendComponent implements OnInit {

  @Input() context: legendContext;
  @Input() config: IConfig;

  private contextGroupsToDelete = {
    'explorer': ['foundNode', 'foundDrug', 'seedNode'],
    'adjacentDrugs': ['foundNode', 'seedNode'],
    'drugTarget': ['foundDrug', 'seedNode'],
    'drug': ['seedNode']
  }

  public checkContext(nodeGroupKey) {
    if (nodeGroupKey === 'selectedNode') {
      // selected node is not supposed to appear in legend
      return false;
    }
    if (this.contextGroupsToDelete[this.context].includes(nodeGroupKey)) {
      return false;
    }
    return true;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
