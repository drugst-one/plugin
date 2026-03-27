import { Component, OnInit } from '@angular/core';
import { NetworkHandlerService } from 'src/app/services/network-handler/network-handler.service';

@Component({
  standalone: false,
  selector: 'app-network-control',
  templateUrl: './network-control.component.html',
  styleUrls: ['./network-control.component.scss']
})
export class NetworkControlComponent implements OnInit {

  constructor(public networkHandler: NetworkHandlerService) { }

  ngOnInit(): void {
  }

  public fitNetwork() {
    this.networkHandler.activeNetwork.networkInternal.fit();
  }

}
