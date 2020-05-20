import {Injectable} from '@angular/core';
import {IHost, IUser} from "../types";
import {Subject} from "rxjs";
import {LocationService} from "./location.service";

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dataSource$ = new Subject<IUser[]>();

  private list;
  private host: IHost;

  constructor(
              private readonly locationService: LocationService,
              ) {

    let locationServiceUnsubscribe = this.locationService.getHost$.subscribe( (host: IHost) => {
      if (host) {
        this.host = host;
        if (this.host.chatId) {
          chrome.storage.sync.get([host.chatId], (result) => {
            this.list = result[host.chatId] || [];
            this.dataSource$.next(this.list);
            locationServiceUnsubscribe.unsubscribe();

            this.dataSource$.subscribe((newList: IUser[]) => {
              chrome.storage.sync.set({ [this.host.chatId]: newList });
            })
          });
        }
      }
    });
  }

  add(user: IUser) {
    if ( !this.list.some(u => u.id === user.id) ) {
      user.id.trim();
      user.name.trim();
      this.list.unshift(user);
      this.dataSource$.next(this.list);
    }
  }

  update(user: IUser) {
    user.id.trim();
    user.name.trim();

   this.list.some(u => {
      if (u.id === user.id) {
        u.id = user.id;
        u.name = user.name;
        u.color = user.color;
        u.ignore = user.ignore;
      }
    })
    this.dataSource$.next(this.list);
  }

  delete(user) {
    this.list = this.list.filter(u => u.id !== user.id);
    this.dataSource$.next(this.list);
  }

  getList() {
    return this.dataSource$.asObservable();
  }
}
