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
    const data = JSON.parse(JSON.stringify(item.data));
    // add possible missing attributes to not throw errors
    if (data.ensg === undefined) {data.ensg = []};
    if (data.groupName === undefined) {data.groupName = ''};
    if (data.type === undefined) {data.type = ''};
    if (data.symbol === undefined) {data.symbol = ''};
    if (data.proteinName === undefined) {data.proteinName = ''};
    if (data.uniprotAc === undefined) {data.uniprotAc = ''};
    if (data.drugId === undefined) {data.drugId = ''};

    data.ensg = data.ensg.map(x => x.toLowerCase())
    return data.symbol.toLowerCase().indexOf(term) > -1 || data.uniprotAc.toLowerCase().indexOf(term) > -1 || 
      data.label.toLowerCase().indexOf(term) > -1 || data.ensg.includes(term) || data.id.toLowerCase().indexOf(term) > -1 
      || data.proteinName.toLowerCase().indexOf(term) > -1 || data.type.toLowerCase().indexOf(term) > -1 || 
      data.groupName.toLowerCase().indexOf(term) > -1 || data.drugId.toLowerCase().indexOf(term) > -1;
  
  }

  select(item) {
    this.selectItem.emit(item);
  }

}
