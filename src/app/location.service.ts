import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {IHost} from "../types";

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private hostname: string = '';
  private chatId: string = '';

  public getHost$: Subject<IHost> = new BehaviorSubject(null);

  constructor() {
    if (chrome) {
      chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = new URL(tabs[0].url);
        this.hostname = url.hostname;
        this.chatId = url.pathname.split('/')[2];

        this.getHost$.next({
          hostname: this.hostname,
          chatId: this.chatId
        })
      });
    }
  }

  public getHostname() {
    return this.hostname;
  }
}
