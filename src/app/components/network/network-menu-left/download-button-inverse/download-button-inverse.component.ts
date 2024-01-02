import { Component, Input, OnInit } from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import {
  downloadCSV,
  downloadEdgeAttributes,
  downLoadFile,
  downloadGraphml,
  downloadJSON,
  downloadNodeAttributes
} from 'src/app/utils';
import {NetworkHandlerService} from 'src/app/services/network-handler/network-handler.service';

@Component({
  selector: 'app-download-button-inverse',
  templateUrl: './download-button-inverse.component.html',
  styleUrls: ['./download-button-inverse.component.scss']
})
export class DownloadButtonInverseComponent implements OnInit {

  @Input() nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  @Input() buttonId: string;

  constructor(public drugstoneConfig: DrugstoneConfigService, public netex: NetexControllerService, public networkHandler: NetworkHandlerService) { }

  ngOnInit(): void {
  }

  public downloadLink(fmt) {
    const data = {nodes: this.nodeData.nodes.get(), edges: this.nodeData.edges.get(), fmt: fmt};
    this.netex.graphExport(data).subscribe(response => {
      return downLoadFile(response, `application/${fmt}`, fmt);
    });
  }

  public download(fmt) {
    let nodes = this.nodeData.nodes.get();
    const edges = this.nodeData.edges.get();

    const data = {
      nodes: this.nodeData.nodes.get(),
      edges: this.nodeData.edges.get(),
    };

    // add expression data if active
    if (Object.keys(this.networkHandler.activeNetwork.expressionMap).length) {
      downloadNodeAttributes.push('expression');
      const nodesWithExpression = [];
      nodes.forEach(node => {
        if (this.networkHandler.activeNetwork.expressionMap.hasOwnProperty(node.id)) {
          node.expression = this.networkHandler.activeNetwork.expressionMap[node.id];
          nodesWithExpression.push(node);
        }
      });
      nodes = nodesWithExpression;
    }

    if (fmt === "json") {
      downloadJSON(
        nodes,
        edges,
        downloadNodeAttributes,
        downloadEdgeAttributes
      );
    } else if (fmt === 'graphml') {
      downloadGraphml(
        nodes,
        edges,
        downloadNodeAttributes,
        downloadEdgeAttributes
      )
    } else if(fmt === 'csv'){
      downloadCSV(
        nodes,
        edges,
        downloadNodeAttributes,
        downloadEdgeAttributes
      )
    }

  }

}
