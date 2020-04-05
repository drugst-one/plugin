import { Component, Input, Output, EventEmitter } from '@angular/core';
import {QueryItem} from '../../interfaces';

@Component({
  selector: 'app-query-component',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent {


  @Output() selectItem: EventEmitter<any> = new EventEmitter();
  @Input() queryItems: QueryItem[];

  select(item) {
    this.selectItem.emit(item);
  }

}
