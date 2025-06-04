import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Dataset} from '../../interfaces';



@Component({

  selector: 'app-dataset-tile',

  templateUrl: './dataset-tile.component.html',

  styleUrls: ['./dataset-tile.component.scss']

})



export class DatasetTileComponent {



  @Input() selectedDataset: Dataset;

  @Output() selectedDatasetChange: EventEmitter<any> = new EventEmitter();



  @Input() datasetItems: Dataset[];



  public select(selectionItem) {

    this.selectedDataset = selectionItem;

    this.selectedDatasetChange.emit(selectionItem);

  }



}

