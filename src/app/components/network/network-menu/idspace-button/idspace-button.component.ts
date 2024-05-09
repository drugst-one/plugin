import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Identifier } from 'src/app/config';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';

@Component({
  selector: 'app-idspace-button',
  templateUrl: './idspace-button.component.html',
  styleUrls: ['./idspace-button.component.scss']
})
export class IdspaceButtonComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService, public networkHandler: NetworkHandlerService) { }

  public idspace: string;
  @Input() buttonId: string;

  @Output() resetEmitter: EventEmitter<boolean> = new EventEmitter();


  ngOnInit(): void {
    if (this.drugstoneConfig.currentConfig().identifier){
      this.idspace = this.drugstoneConfig.currentConfig().identifier;
    }
  }

  public changeIdspace(idspace: Identifier){
    this.idspace = idspace;
    let currentConfig = this.drugstoneConfig.currentConfig();
    currentConfig.identifier = idspace;
    this.drugstoneConfig.set_analysisConfig(currentConfig);
    this.resetEmitter.emit(true);
  }

}
