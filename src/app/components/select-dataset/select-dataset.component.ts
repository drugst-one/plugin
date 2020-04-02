import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DataSet} from 'vis-data';
import {Edge, Effect, Protein} from '../../pages/protein-network';

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
