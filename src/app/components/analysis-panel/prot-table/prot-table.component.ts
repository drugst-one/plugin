import {Component, Input, OnInit} from '@angular/core';



@Component({

  selector: 'app-prot-table',

  templateUrl: './prot-table.component.html',

  styleUrls: ['./prot-table.component.scss'],

})

export class ProtTableComponent implements OnInit {



  @Input() public tableHasScores = true;

  @Input() public partition = true;

  @Input() public tableProteinScoreTooltip = '';

  @Input() public tableProteins = [];

  @Input() public tableSelectedProteins;

  @Input() public identifier = 'symbol';

  @Input() public tableProteinSelection: (args: any) => void;



  constructor() {

  }



  ngOnInit(): void {

  }



  formatNumber(input): string {

    if (input === 0) {

      return '0';

    }

    if (!input) {

      return 'NA';

    }

    const n = Number(input);

    if (n > 0.01) {

      return n.toPrecision(3);

    }

    return n.toExponential(3).toString();

  }



  hasPathwayEnrichmentScore(): boolean {

    return this.tableProteins.some(row => row.properties && row.properties.score !== undefined);

  }



  hasPathwayEnrichmentRank(): boolean {

    return this.tableProteins.some(row => row.properties && row.properties.rank !== undefined);

  }



}

