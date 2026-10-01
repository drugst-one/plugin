import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-gene-rows',
  templateUrl: './gene-rows.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
