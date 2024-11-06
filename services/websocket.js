import { WebSocketServer } from 'ws';

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map();
    
    this.wss.on('connection', (ws) => {
      const id = Math.random().toString(36).substring(7);
      this.clients.set(id, ws);
      
      ws.on('close', () => {
        this.clients.delete(id);
      });

      console.log(`New WebSocket connection: ${id}`);
    });
  }

  broadcast(data) {
    this.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

export default WebSocketService; 