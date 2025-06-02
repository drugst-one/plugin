import {Component, EventEmitter, OnInit, Output} from '@angular/core';

import {LoadingScreenService} from 'src/app/services/loading-screen/loading-screen.service';

import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';



@Component({

  selector: 'app-loading-screen',

  templateUrl: './loading-screen.component.html',

  styleUrls: ['./loading-screen.component.scss']

})

export class LoadingScreenComponent implements OnInit {



  constructor(private loadingScreen: LoadingScreenService, public drugstoneConfig: DrugstoneConfigService) {

  }



  public active = false;

  public fullscreen = false;



  ngOnInit(): void {

    this.loadingScreen._getUpdates.forEach(bool => this.active = bool);

    this.loadingScreen._isFullscreen.forEach(bool => this.fullscreen = bool);

  }



  @Output() reset: EventEmitter<boolean> = new EventEmitter();



  cancel(): void {

    this.active = false;

    this.reset.emit(true);

  }



}

