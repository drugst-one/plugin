import { Component, OnInit } from '@angular/core';

import { LiveToasts } from 'src/app/interfaces';

import { ToastService } from 'src/app/services/toast/toast.service';



@Component({

  selector: 'app-toast',

  templateUrl: './toast.component.html',

  styleUrls: ['./toast.component.scss']

})

export class ToastComponent implements OnInit {



  public toasts: LiveToasts = {};



  public toastIdPrefix = 'drugstone-toast-id-';







  constructor(public toast: ToastService) { }



  ngOnInit(): void {

    this.toast.getToasts$.forEach(data => {

      this.toasts = data;

    })

  }



  public getDrugstoneClass(type: string) {

    return 'drugstone-plugin-' + type

  }



  public close(id: number) {

    this.toast.deleteToast(id);

  }



  public click(id: number) {

    this.toast.toastClicked(id);

  }



}

