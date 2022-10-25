import {Component, Input, OnInit} from '@angular/core';
@Component({
  selector: 'app-prot-table',
  templateUrl: './prot-table.component.html',
  styleUrls: ['./prot-table.component.scss'],
})
export class ProtTableComponent implements OnInit {

  @Input() public tableHasScores = true;
  @Input() public tableProteinScoreTooltip = "";
  @Input() public tableProteins = []
  @Input() public tableSelectedProteins
  @Input() public identifier = "symbol"
  @Input() public tableProteinSelection : (args: any) => void

  constructor() { }

  ngOnInit(): void {
  }

}
