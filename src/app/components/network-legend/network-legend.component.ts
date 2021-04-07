import {Component, Input, OnInit} from '@angular/core';
import {IConfig} from '../../config';

@Component({
  selector: 'app-network-legend',
  templateUrl: './network-legend.component.html',
  styleUrls: ['./network-legend.component.scss']
})
export class NetworkLegendComponent implements OnInit {

  @Input() config: IConfig;

  constructor() { }

  ngOnInit(): void {
  }

}
