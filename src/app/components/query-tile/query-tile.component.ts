import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Protein, Wrapper, ViralProtein} from '../../interfaces';

@Component({
  selector: 'app-query-tile-component',
  templateUrl: './query-tile.component.html',
  styleUrls: ['./query-tile.component.scss']
})
export class QueryTileComponent {


  @Output() selectItem: EventEmitter<any> = new EventEmitter();
  @Input() queryItems: Wrapper[];

  querySearch(term: string, item: Wrapper) {
    term = term.toLowerCase();
    const data = item.data as Protein;
    return data.name.toLowerCase().indexOf(term) > -1 || data.proteinName.toLowerCase().indexOf(term) > -1 ||
      item.type.toLowerCase().indexOf(term) > -1;
  }

  select(item) {
    this.selectItem.emit(item);
  }

}
