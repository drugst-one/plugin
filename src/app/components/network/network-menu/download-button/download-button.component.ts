import { Component, Input, OnInit } from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { downLoadFile, downloadCSV } from 'src/app/utils';
import {NetworkHandlerService} from "../../../../services/network-handler/network-handler.service";

@Component({
  selector: 'app-download-button',
  templateUrl: './download-button.component.html',
  styleUrls: ['./download-button.component.scss']
})
export class DownloadButtonComponent implements OnInit {

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

}
