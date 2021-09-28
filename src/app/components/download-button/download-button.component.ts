import { Component, Input, OnInit } from '@angular/core';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { downLoadFile } from 'src/app/utils';

@Component({
  selector: 'app-download-button',
  templateUrl: './download-button.component.html',
  styleUrls: ['./download-button.component.scss']
})
export class DownloadButtonComponent implements OnInit {

  @Input() nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  @Input() smallStyle: boolean;
  @Input() buttonId: string;

  constructor(public netex: NetexControllerService) { }

  ngOnInit(): void {
  }

  public downloadLink(fmt) {
    const data = {nodes: this.nodeData.nodes.get(), edges: this.nodeData.edges.get(), fmt: fmt};
    this.netex.graphExport(data).subscribe(response => {
      return downLoadFile(response, `application/${fmt}`, fmt);
    });
  }

}
