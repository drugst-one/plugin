import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {faBook, faCheck, faMicroscope, faTimes} from '@fortawesome/free-solid-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-drug-table',
  templateUrl: './drug-table.component.html',
  styleUrls: ['./drug-table.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class DrugTableComponent implements OnInit {

  @Input() public tableHasScores = true;
  @Input() public tableDrugScoreTooltip = "";
  @Input() public tableDrugs = []

  public faTimes = faTimes;
  public faCheck = faCheck;
  public faMicroscope = faMicroscope;
  public faBook = faBook;
  public faQuestionCircle = faQuestionCircle;

  constructor() { }

  ngOnInit(): void {
  }

}
