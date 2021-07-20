import {Component, Input, OnInit} from '@angular/core';
import {IConfig} from '../../config';

@Component({
  selector: 'app-network-legend',
  templateUrl: './network-legend.component.html',
  styleUrls: ['./network-legend.component.scss']
})
export class NetworkLegendComponent implements OnInit {
  public legendConfig: IConfig;

  @Input() analysis: boolean;
  @Input() set config(value: IConfig) {
    // copy to not override user config
    value = JSON.parse(JSON.stringify(value));
    // remove selected node group since it is just a border
    delete value.nodeGroups.selectedNode;
    if (!this.analysis) {
      // do not show the analysis-groups in the explorer network
      delete value.nodeGroups.foundNode;
      delete value.nodeGroups.foundDrug;
      delete value.nodeGroups.seedNode;
    }
    this.legendConfig = value;
  };

  constructor() { }

  ngOnInit(): void {
  }

}
