import {Component, Input, OnInit} from '@angular/core';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-regular-svg-icons';
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
  public faTimes = faTimes;
  public faCheck = faCheck;
  public faQuestionCircle = faQuestionCircle;

  constructor() { }

  ngOnInit(): void {
  }

}
