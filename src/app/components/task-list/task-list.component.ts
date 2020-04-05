import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService} from '../../analysis.service';


@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})

export class TaskListComponent implements OnInit {

  @Input() token: string;
  @Output() tokenChange: EventEmitter<string> = new EventEmitter();

  constructor(public analysis: AnalysisService) {
  }

  ngOnInit(): void {
  }

  open(token) {
    this.token = token;
    this.tokenChange.emit(token);
  }

}
