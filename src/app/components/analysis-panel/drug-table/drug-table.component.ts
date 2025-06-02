import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';



@Component({

  selector: 'app-drug-table',

  templateUrl: './drug-table.component.html',

  styleUrls: ['./drug-table.component.scss'],

})

export class DrugTableComponent implements OnInit {



  @Input() public tableHasScores = true;

  @Input() public tableDrugScoreTooltip = "";

  @Input() public tableDrugs = []



  constructor() { }



  ngOnInit(): void {

  }



  formatNumber(input): string {

    if (!input) {

      return 'NA';

    }

    const n = Number(input);

    if (n > 0.01) {

      return n.toPrecision(3);

    }

    return n.toExponential(3).toString();

  }

}

