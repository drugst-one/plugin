import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Protein, Wrapper, ViralProtein} from '../../interfaces';

@Component({
  selector: 'app-query-component',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent {


  @Output() selectItem: EventEmitter<any> = new EventEmitter();
  @Input() queryItems: Wrapper[];

  querySearch(term: string, item: Wrapper) {
    term = term.toLowerCase();
    if (item.type === 'host') {
      const data = item.data as Protein;
      return data.name.toLowerCase().indexOf(term) > -1 || data.proteinAc.toLowerCase().indexOf(term) > -1 ||
        item.type.toLowerCase().indexOf(term) > -1;
    } else {
      const data = item.data as ViralProtein;
      return data.effectName.toLowerCase().indexOf(term) > -1 || data.virusName.toLowerCase().indexOf(term) > -1 ||
        item.type.toLowerCase().indexOf(term) > -1;
    }
  }

  select(item) {
    this.selectItem.emit(item);
  }

}
