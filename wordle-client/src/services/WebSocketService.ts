// src/services/WebSocketService.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getApiBaseUrl = (): string => {
  return 'http://localhost:8080';
};

export class WebSocketService {
  private stompClient: Client | null = null;
  private roomId: string | null = null;

  connect(roomId: string, onMessage: (message: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.roomId = roomId;
      
      const wsUrl = getApiBaseUrl() + '/ws';
      console.log('Connecting to WebSocket at:', wsUrl);
      
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        debug: (str) => console.log('STOMP: ' + str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.stompClient.onConnect = () => {
        console.log('Connected to WebSocket');
        
        this.stompClient?.subscribe(`/topic/room/${roomId}`, (message) => {
          const data = JSON.parse(message.body);
          onMessage(data);
        });
        
        resolve();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        reject(new Error('WebSocket connection failed'));
      };

      this.stompClient.activate();
    });
  }

  sendGuess(playerId: string, guess: string) {
    if (this.stompClient && this.roomId) {
      this.stompClient.publish({
        destination: `/app/guess/${this.roomId}`,
        body: JSON.stringify({ playerId, guess })
      });
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}
