import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';
import { Order } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection?: signalR.HubConnection;
  private connectionState = new BehaviorSubject<boolean>(false);
  public connectionState$ = this.connectionState.asObservable();

  private newOrder = new BehaviorSubject<Order | null>(null);
  public newOrder$ = this.newOrder.asObservable();

  private customerUpdated = new BehaviorSubject<string | null>(null);
  public customerUpdated$ = this.customerUpdated.asObservable();

  constructor() { }

  public async startConnection(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveOrder', (order: Order) => {
      this.newOrder.next(order);
    });

    this.hubConnection.on('CustomerUpdated', (customerId: string) => {
      this.customerUpdated.next(customerId);
    });

    this.hubConnection.onreconnecting(() => {
      this.connectionState.next(false);
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState.next(true);
    });

    this.hubConnection.onclose(() => {
      this.connectionState.next(false);
    });

    await this.hubConnection.start();
    this.connectionState.next(true);
  }

  public async joinCustomerGroup(customerId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinCustomerGroup', customerId);
    }
    return Promise.reject('Connection not established');
  }

  public async leaveCustomerGroup(customerId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('LeaveCustomerGroup', customerId);
    }
    return Promise.reject('Connection not established');
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.connectionState.next(false);
    }
  }
}
