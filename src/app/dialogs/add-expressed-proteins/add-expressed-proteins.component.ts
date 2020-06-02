import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AnalysisService} from '../../analysis.service';
import {Protein} from '../../interfaces';

@Component({
  selector: 'app-add-expressed-proteins',
  templateUrl: './add-expressed-proteins.component.html',
  styleUrls: ['./add-expressed-proteins.component.scss']
})
export class AddExpressedProteinsComponent implements OnChanges {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Input()
  public visibleNodes: Array<any> = [];
  @Input()
  public currentViewProteins: Array<Protein> = [];

  public proteins = [];

  public threshold = 5;

  constructor(private analysis: AnalysisService) {
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  public addVisibleProteins() {
    this.analysis.addExpressedHostProteins(this.visibleNodes, this.currentViewProteins, this.threshold);
  }

  public setThreshold(threshold: number) {
    this.threshold = threshold;
    if (!this.currentViewProteins) {
      return;
    }
    this.proteins = this.currentViewProteins.filter(p => p.expressionLevel >= threshold);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setThreshold(this.threshold);
  }

}
