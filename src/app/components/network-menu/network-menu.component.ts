import { Component, Input, OnInit } from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-network-menu',
  templateUrl: './network-menu.component.html',
  styleUrls: ['./network-menu.component.scss']
})
export class NetworkMenuComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService) { }

  @Input() networkContext: any;


  ngOnInit(): void {
  }

}
