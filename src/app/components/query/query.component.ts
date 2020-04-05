import { Component, Input, Output, EventEmitter } from '@angular/core';
import {Protein} from '../../interfaces';

@Component({
  selector: 'app-query-component',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent {


  @Output() selectProtein: EventEmitter<Protein> = new EventEmitter();
  @Input() queryItems: Protein[];

  select(protein) {
    this.selectProtein.emit(protein);
  }

}
