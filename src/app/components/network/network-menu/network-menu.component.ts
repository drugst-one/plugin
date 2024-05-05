import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
  selector: 'app-network-menu',
  templateUrl: './network-menu.component.html',
  styleUrls: ['./network-menu.component.scss']
})
export class NetworkMenuComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService, public networkHandler: NetworkHandlerService, public netex: NetexControllerService, public toast: ToastService) { }

  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();
  @Output() networkEmitter: EventEmitter<string> = new EventEmitter();

  ngOnInit(): void {
  }

  public uploadNetworkFile(event: any) {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    this.toast.setNewToast({
      message: `The file ${file.name} was uploaded and will be parsed.`,
      type: 'success'
    });
    this.netex.parseFile(file).then(response => {
      if (response){
        this.networkEmitter.emit(JSON.stringify(response));
        this.toast.setNewToast({
          message:
            `The file ${file.name} was parsed successfully.`,
          type: 'success'
        });
      } else {
        this.toast.setNewToast({
          message: `The file ${file.name} could not be parsed. We support .csv adjacency lists, .sif and .graphml files.`,
          type: 'danger'
        });
      }
    }).catch(() => {
      this.toast.setNewToast({
        message: `The file ${file.name} could not be parsed. We support .csv adjacency lists, .sif and .graphml files.`,
        type: 'danger'
      });
    });
  }

  public reset() {
    this.resetEmitter.emit(true);
  }

}
