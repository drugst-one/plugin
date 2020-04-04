import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-analysis-window',
  templateUrl: './analysis-window.component.html',
  styleUrls: ['./analysis-window.component.scss']
})
export class AnalysisWindowComponent implements OnInit {

  @Input() analysisWindow: boolean;
  @Output() closeWindow = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  closeAnalysisWindow() {
    this.closeWindow.emit(this.analysisWindow);
  }

  discard() {

  }

  export() {

  }
}
