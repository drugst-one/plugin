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

}
