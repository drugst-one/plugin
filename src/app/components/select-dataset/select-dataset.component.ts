import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-select-dataset',
  templateUrl: './select-dataset.component.html',
  styleUrls: ['./select-dataset.component.scss']
})

export class SelectDatasetComponent {

  @Input() selectedDataset;
  @Output() selectedDatasetChange: EventEmitter<any> = new EventEmitter();

  @Input() datasetItems: Array<{label: string, datasets: string, data: Array<[string, string]>}>;

  public select(selectionItem) {
    this.selectedDataset = selectionItem;
    this.selectedDatasetChange.emit(selectionItem);
  }

}
