import { API_BASE_URL } from "./api-client";

/**
 * §9.9/§10's ticket-authenticated WebSocket, shared by the buyer PWA
 * (`/ws/buyer`) and the Trading Console (`/ws/console`) — same reconnect
 * discipline for both: exponential backoff 1s -> 30s cap with jitter, and
 * always re-fetching current state on (re)connect rather than trusting a
 * possibly-missed frame.
 */
export class TicketSocket {
  private socket: WebSocket | null = null;
  private attempt = 0;
  private closedByUser = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private path: "/ws/buyer" | "/ws/console",
    private getTicket: () => Promise<string>,
    private onEvent: (event: string, data: unknown) => void,
    private onReconnect: () => void
  ) {}

  async connect(): Promise<void> {
    this.closedByUser = false;
    try {
      const ticket = await this.getTicket();
      // close() may have already fired while the ticket request was in
      // flight — this.socket was still null then, so it couldn't close
      // anything. Recheck now, or a closed-before-connected caller leaks
      // an orphaned socket nothing will ever close.
      if (this.closedByUser) return;
      const wsUrl = API_BASE_URL.replace(/^http/, "ws");
      this.socket = new WebSocket(`${wsUrl}/api/v1${this.path}?ticket=${encodeURIComponent(ticket)}`);

      this.socket.onopen = () => {
        this.attempt = 0;
        this.onReconnect();
      };
      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string);
          this.onEvent(parsed.event, parsed.data);
        } catch {
          // Malformed frame — ignore rather than crash the socket handler.
        }
      };
      this.socket.onclose = () => this.scheduleReconnect();
      this.socket.onerror = () => this.socket?.close();
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.closedByUser) return;
    const base = Math.min(1000 * 2 ** this.attempt, 30000);
    const jitter = Math.random() * base * 0.2;
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => void this.connect(), base + jitter);
  }

  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }
}
