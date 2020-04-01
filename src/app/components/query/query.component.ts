import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-query-component',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent {


  @Output() selectProtein: EventEmitter<string> = new EventEmitter();
  @Input() queryItems: any[];

  select(protein) {
    console.log(protein);
    this.selectProtein.emit('pg_' + protein.groupId);
  }

}
