import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-gene-rows',
  templateUrl: './gene-rows.component.html',
  styleUrls: ['./gene-rows.component.scss']
})
export class GeneRowsComponent implements OnInit {

  @Input() gene!: any;

  constructor() { }

  ngOnInit(): void {
  }

  formatArray(arr: string[]): string {
    return arr ? arr.join(', ') : '';
  }


}
