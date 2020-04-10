import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Dataset} from '../../interfaces';

@Component({
  selector: 'app-select-dataset',
  templateUrl: './select-dataset.component.html',
  styleUrls: ['./select-dataset.component.scss']
})

export class SelectDatasetComponent {

  @Input() selectedDataset: Dataset;
  @Output() selectedDatasetChange: EventEmitter<any> = new EventEmitter();

  @Input() datasetItems: Dataset[];

  public select(selectionItem) {
    this.selectedDataset = selectionItem;
    this.selectedDatasetChange.emit(selectionItem);
  }

}
