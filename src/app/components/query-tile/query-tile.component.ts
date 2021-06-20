import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Node, Wrapper} from '../../interfaces';

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
    const data = item.data as Node;
    return data.symbol.toLowerCase().indexOf(term) > -1 || item.type.toLowerCase().indexOf(term) > -1;
  }

  select(item) {
    this.selectItem.emit(item);
  }

}
