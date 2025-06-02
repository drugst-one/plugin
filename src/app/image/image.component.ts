import { Component, Input, OnInit } from '@angular/core';

import { version } from '../../version';



@Component({

  selector: 'app-image',

  templateUrl: './image.component.html',

  styleUrls: ['./image.component.scss']

})

export class ImageComponent implements OnInit {



  constructor() { }



  public _source: string;

  public version: string;



  @Input() set _src(src: string) {

    this._source = src;

  }



  @Input() _alt: string;

  @Input() _title: string;

  @Input() _class: string;



  ngOnInit(): void {

    this.version = version;

  }



}

