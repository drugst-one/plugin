import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DrugstoneConfigService} from '../../../services/drugstone-config/drugstone-config.service';
import {algorithmNames, AnalysisService} from '../../../services/analysis/analysis.service';

@Component({
  selector: 'app-view-list',
  templateUrl: './view-list.component.html',
  styleUrls: ['./view-list.component.scss']
})
export class ViewListComponent implements OnInit {
  @Input() token: string;
  @Output() tokenChange: EventEmitter<string> = new EventEmitter();
  constructor(public drugstoneConfig: DrugstoneConfigService, public analysis: AnalysisService) { }

  ngOnInit(): void {
  }

  open(token) {
    this.token = token;
    this.tokenChange.emit(token);
  }

  protected readonly algorithmNames = algorithmNames;
}
