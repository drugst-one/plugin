import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-select-dataset',
  templateUrl: './select-dataset.component.html',
  styleUrls: ['./select-dataset.component.scss']
})

export class SelectDatasetComponent {

  @Output() selectDataset: EventEmitter<any> = new EventEmitter();

  @Input() datasetItems: Array<{label: string, datasets: string, data: Array<[string, string]>}>;

  public select(selectionItem) {
    this.selectDataset.emit(selectionItem.data);
  }

}
