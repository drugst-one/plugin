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

  private contextNodeGroupsToDelete = {
    'explorer': ['foundNode', 'foundDrug', 'seedNode', 'default'],
    'adjacentDrugs': ['foundNode', 'seedNode', 'default'],
    'drugTarget': ['foundDrug', 'seedNode', 'default'],
    'drug': ['seedNode', 'default'],
    'drugTargetAndSeeds': ['foundDrug', 'default'],
    'drugAndSeeds': ['default']
  }

  private contextEdgeGroupsToDelete = {
    'explorer': ['default'],
    'adjacentDrugs': ['default'],
    'drugTarget': ['default'],
    'drug': ['default'],
    'drugTargetAndSeeds': ['default'],
    'drugAndSeeds': ['default']
  }

  public checkNodeGroupContext(nodeGroupKey) {
    if (nodeGroupKey === 'selectedNode') {
      // selected node is not supposed to appear in legend
      return false;
    }
    if (this.contextNodeGroupsToDelete[this.context].includes(nodeGroupKey)) {
      return false;
    }
    return true;
  }

  public checkEdgeGroupContext(edgeGroupKey) {
    if (this.contextEdgeGroupsToDelete[this.context].includes(edgeGroupKey)) {
      return false;
    }
    return true;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
