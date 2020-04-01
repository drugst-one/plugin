import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService} from '../../analysis.service';

@Component({
  selector: 'app-protein-analysis',
  templateUrl: './protein-analysis.component.html',
  styleUrls: ['./protein-analysis.component.scss']
})
export class ProteinAnalysisComponent implements OnInit {

  @Input()
  public show = false;

  @Output()
  public showChange = new EventEmitter<boolean>();

  constructor(public analysis: AnalysisService) {
  }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

}
