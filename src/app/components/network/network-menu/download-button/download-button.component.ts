import { Component, Input, OnInit } from "@angular/core";

import { DrugstoneConfigService } from "src/app/services/drugstone-config/drugstone-config.service";

import { NetexControllerService } from "src/app/services/netex-controller/netex-controller.service";

import {

  downloadNodeAttributes,

  downloadEdgeAttributes,

  downloadJSON,

  downloadGraphml, downloadResultCSV, downloadCSV,

} from "src/app/utils";

import { NetworkHandlerService } from "../../../../services/network-handler/network-handler.service";

import { LoggerService } from "src/app/services/logger/logger.service";



@Component({

  selector: "app-download-button",

  templateUrl: "./download-button.component.html",

  styleUrls: ["./download-button.component.scss"],

})

export class DownloadButtonComponent implements OnInit {

  @Input() nodeData: { nodes: any; edges: any } = { nodes: null, edges: null };

  @Input() buttonId: string;



  constructor(

    public drugstoneConfig: DrugstoneConfigService,

    public netex: NetexControllerService,

    public networkHandler: NetworkHandlerService,

    public logger: LoggerService

  ) {}



  ngOnInit(): void {}



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

      const fileName = downloadJSON(

        nodes,

        edges,

        downloadNodeAttributes,

        downloadEdgeAttributes

      );

      this.logger.logMessage(`Downloaded network as JSON: ${fileName}`);

    } else if (fmt === 'graphml') {

      const filename = downloadGraphml(

        nodes,

        edges,

        downloadNodeAttributes,

        downloadEdgeAttributes

      )

      this.logger.logMessage(`Downloaded network as GraphML: ${filename}`);

    } else if(fmt === 'csv'){

      const filename = downloadCSV(

        nodes,

        edges,

        downloadNodeAttributes,

        downloadEdgeAttributes

      )

      this.logger.logMessage(`Downloaded network as CSV: ${filename}`);

    } else if(fmt === 'svg'){

      const filename = this.networkHandler.activeNetwork.exportSVG();

      this.logger.logMessage(`Downloaded network as SVG: ${filename}`);

    }



  }

}

