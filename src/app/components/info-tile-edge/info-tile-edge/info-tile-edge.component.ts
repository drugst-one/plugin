import { Component, Input, OnInit } from '@angular/core';
import { getWrapperFromNode } from 'src/app/interfaces';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';

@Component({
  selector: 'app-info-tile-edge',
  templateUrl: './info-tile-edge.component.html',
  styleUrls: ['./info-tile-edge.component.scss']
})
export class InfoTileEdgeComponent implements OnInit {

  constructor(
    public drugstoneConfig: DrugstoneConfigService,
    private networkHandler: NetworkHandlerService,
    public analysis: AnalysisService
    ) { }

  ngOnInit(): void {
  }

  public edgeAttributes: any;
  public from: any;
  // public fromWrapper: any = null;
  public to: any;
  // public toWrapper: any = null;
  public nodeKeys = ['to', 'from'];

  @Input() set edge(_edge) {
    _edge = JSON.parse(JSON.stringify(_edge));
    // remove attributes that should not be displayed
    _edge['group'] = _edge['groupName'];
    delete _edge['groupName'];
    delete _edge['dashes'];
    delete _edge['color'];
    delete _edge['id'];
    delete _edge['shadow'];

    // order such that 'from' and 'to' are first
    let from =  _edge['from'];
    let to = _edge['to'];
    delete _edge['from'];
    delete _edge['to'];

    // map ids to names
    const toNode = this.networkHandler.activeNetwork.nodeData.nodes.get(to);
    // this.toWrapper = getWrapperFromNode(toNode);
    const fromNode = this.networkHandler.activeNetwork.nodeData.nodes.get(from);
    // this.fromWrapper = getWrapperFromNode(fromNode);

    this.edgeAttributes = [['from', fromNode], ['to', toNode], ...Object.entries(_edge)];
  };

  public zoomTo(nodeId) {
    this.networkHandler.activeNetwork.zoomToNode(nodeId);
  }
}
