import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Identifier } from 'src/app/config';
import { LoggerService } from 'src/app/services/logger/logger.service';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';

@Component({
  selector: 'app-network-menu',
  templateUrl: './network-menu.component.html',
  styleUrls: ['./network-menu.component.scss']
})
export class NetworkMenuComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService, public networkHandler: NetworkHandlerService, public netex: NetexControllerService, public toast: ToastService, public logger: LoggerService, public analysis: AnalysisService) { }

  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();
  @Output() networkEmitter: EventEmitter<string> = new EventEmitter();
  public showAnalysisDialog = false;

  public upload = false;

  @Output()
  public taskEvent = new EventEmitter<object>();

  ngOnInit(): void {
  }

  public changeIdspace(idspace: Identifier) {
    let currentConfig = this.drugstoneConfig.currentConfig();
    currentConfig.identifier = idspace;
    this.drugstoneConfig.set_analysisConfig(currentConfig);
  }

  public async handleUploadEvent(event: { file: File, idSpace: string }) {
    const { file, idSpace } = event;

    this.changeIdspace(idSpace as Identifier);

    this.toast.setNewToast({
      message: `The file ${file.name} and ID-Space ${idSpace} were selected.`,
      type: 'success'
    });

    this.netex.parseFile(file).then(response => {
      if (response) {
        this.networkEmitter.emit(JSON.stringify(response));
        this.logger.changeComponent('Uploaded Network');
        this.logger.logMessage(`The network ${file.name} was uploaded and parsed successfully. ID-Space: ${idSpace}. Nodes: ${response.nodes.length}, Edges: ${response.edges.length}.`);
        this.toast.setNewToast({
          message: `The file ${file.name} was parsed successfully.`,
          type: 'success'
        });
      } else {
        this.logger.logMessage(`The file ${file.name} could not be parsed or uploaded.`);
        this.toast.setNewToast({
          message: `The file ${file.name} could not be parsed. Supported formats: .csv, .sif, .gt, .graphml.`,
          type: 'danger'
        });
      }
    }).catch(() => {
      this.toast.setNewToast({
        message: `The file ${file.name} could not be parsed. Supported formats: .csv, .sif, .gt, .graphml.`,
        type: 'danger'
      });
    });
  }

  public reset() {
    this.resetEmitter.emit(true);
  }

}
