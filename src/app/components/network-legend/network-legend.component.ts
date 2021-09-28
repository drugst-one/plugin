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
  @Input() smallStyle: boolean;

  private contextNodeGroupsToDelete = {
    'explorer': ['foundNode', 'foundDrug', 'seedNode', 'default', 'defaultDisorder'],
    'adjacentDrugs': ['foundNode', 'seedNode', 'default', 'defaultDisorder'],
    'adjacentDisorders': ['foundDrug', 'foundNode', 'seedNode', 'default'],
    'adjacentDrugsAndDisorders': ['foundNode', 'seedNode', 'default'],
    'drugTarget': ['foundDrug', 'seedNode', 'default', 'defaultDisorder'],
    'drug': ['seedNode', 'default', 'defaultDisorder'],
    'drugTargetAndSeeds': ['foundDrug', 'default', 'defaultDisorder'],
    'drugAndSeeds': ['default', 'defaultDisorder']
  }

  private contextEdgeGroupsToDelete = {
    'explorer': ['default'],
    'adjacentDrugs': ['default'],
    'adjacentDisorders': ['default'],
    'adjacentDrugsAndDisorders' :['default'],
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
    return !this.contextNodeGroupsToDelete[this.context].includes(nodeGroupKey);
  }

  public checkEdgeGroupContext(edgeGroupKey) {
    return !this.contextEdgeGroupsToDelete[this.context].includes(edgeGroupKey);
  }

  constructor() { }

  ngOnInit(): void {
  }

}
