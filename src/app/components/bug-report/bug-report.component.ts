import {Component, OnInit} from '@angular/core';

import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';

import {NetexControllerService} from '../../services/netex-controller/netex-controller.service';



@Component({

  selector: 'app-bug-report',

  templateUrl: './bug-report.component.html',

  styleUrls: ['./bug-report.component.scss']

})

export class BugReportComponent implements OnInit {



  constructor(public drugstoneConfig: DrugstoneConfigService, public http: NetexControllerService) {

  }



  public close() {

    this.drugstoneConfig.showBugreport = false;

  }



  public send(title, body, email) {

    this.http.sendBugreport({title, body, email}).then(response => {

      if (response.status === 200) {

        this.close();

      } else {

        console.log('Error sending bugreport');

      }

    }).finally(() => {

      this.close();

    }).catch(console.error);

  }



  ngOnInit(): void {

  }



}

