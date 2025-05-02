import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
} from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss'],
})
export class WhiteboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false })
  canvas!: ElementRef<HTMLCanvasElement>;
  @Input() roomId: string = '1';

  private ctx!: CanvasRenderingContext2D;
  private connection!: signalR.HubConnection;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  isEraserActive = false;
  color = '#000000';
  lineWidth = 5;
  isModalOpen = false;

  ngOnInit(): void {
    this.initializeSignalR();
  }

  ngAfterViewInit(): void {
    this.initializeCanvas();
  }

  ngOnDestroy(): void {
    if (this.connection) {
      this.connection.off('LoadDrawingActions');
      this.connection.off('ReceiveDrawingAction');
      this.connection.off('WhiteboardCleared');
    }
  }

  private initializeSignalR(): void {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7035/whiteboardhub', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('LoadDrawingActions', (actions) =>
      actions.forEach((a: any) => this.handleIncomingDrawing(a))
    );

    this.connection.on('ReceiveDrawingAction', (action) =>
      this.handleIncomingDrawing(action)
    );

    this.connection.on('WhiteboardCleared', () => {
      this.ctx?.clearRect(
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height
      );
    });

    this.connection
      .start()
      .then(() => this.connection.invoke('JoinRoom', this.roomId))
      .catch((err) => console.error('SignalR error:', err));
  }

  private initializeCanvas(): void {
    if (!this.canvas) return;

    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    if (!this.ctx) return;

    this.resizeCanvas();
    this.setupDrawingEvents();
    this.updateCursor();

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      this.connection
        .invoke('RequestDrawingHistory', this.roomId)
        .catch(console.error);
    }
  }

  private setupDrawingEvents(): void {
    const canvasEl = this.canvas.nativeElement;

    canvasEl.onmousedown = (e) => this.startDrawing(e);
    canvasEl.onmousemove = (e) => this.draw(e);
    canvasEl.onmouseup = () => this.stopDrawing();
    canvasEl.onmouseleave = () => this.stopDrawing();
  }

  private startDrawing(event: MouseEvent): void {
    if (!this.ctx) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this.isDrawing = true;
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;

    this.sendDrawingAction({
      type: 'start',
      x: this.lastX,
      y: this.lastY,
      color: this.isEraserActive ? '#FFFFFF' : this.color,
      lineWidth: this.lineWidth,
    });
  }

  private draw(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const action = {
      type: 'draw',
      x: this.lastX,
      y: this.lastY,
      toX: currentX,
      toY: currentY,
      color: this.isEraserActive ? '#FFFFFF' : this.color,
      lineWidth: this.lineWidth,
    };

    this.sendDrawingAction(action);
    this.handleIncomingDrawing(action);

    this.lastX = currentX;
    this.lastY = currentY;
  }

  private stopDrawing(): void {
    this.isDrawing = false;
  }

  private handleIncomingDrawing(action: any): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = action.color;
    this.ctx.lineWidth = action.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    switch (action.type) {
      case 'start':
        this.ctx.beginPath();
        this.ctx.moveTo(action.x, action.y);
        break;
      case 'draw':
        this.ctx.beginPath();
        this.ctx.moveTo(action.x, action.y);
        this.ctx.lineTo(action.toX, action.toY);
        this.ctx.stroke();
        break;
      case 'clear':
        this.ctx.clearRect(
          0,
          0,
          this.canvas.nativeElement.width,
          this.canvas.nativeElement.height
        );
        break;
    }
  }

  private sendDrawingAction(action: any): void {
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      this.connection
        .invoke('SendDrawingAction', this.roomId, action)
        .catch(console.error);
    }
  }

  clearCanvas(): void {
    if (!this.ctx) return;

    this.ctx.clearRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );

    if (this.connection.state === signalR.HubConnectionState.Connected) {
      this.connection
        .invoke('ClearWhiteboard', this.roomId)
        .catch(console.error);
    }
  }

  toggleEraser(): void {
    this.isEraserActive = !this.isEraserActive;
    this.updateCursor();
  }

  changeColor(color: string): void {
    this.color = color;
  }

  changeLineWidth(width: number): void {
    this.lineWidth = width;
    this.updateCursor();
  }

  openModal(): void {
    this.isModalOpen = true;
    setTimeout(() => this.initializeCanvas(), 0);
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  private updateCursor(): void {
    const canvasEl = this.canvas.nativeElement;

    if (this.isEraserActive) {
      const size = this.lineWidth;
      const cursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><circle cx='${
        size / 2
      }' cy='${size / 2}' r='${
        size / 2 - 1
      }' fill='white' stroke='black' stroke-width='1'/></svg>`;
      canvasEl.style.cursor = `url("data:image/svg+xml;utf8,${cursorSvg}") ${
        size / 2
      } ${size / 2}, auto`;
    } else {
      canvasEl.style.cursor = 'crosshair';
    }
  }

  private resizeCanvas(): void {
    const canvasEl = this.canvas.nativeElement;
    const modalBody = canvasEl.parentElement;
    if (!modalBody) return;

    const actions = this.ctx ? this.getCanvasState() : [];

    canvasEl.width = modalBody.offsetWidth;
    canvasEl.height = modalBody.offsetHeight - 50;

    this.ctx = canvasEl.getContext('2d')!;
    if (actions.length) this.redrawCanvas(actions);
  }

  private getCanvasState(): any[] {
    // Placeholder for actual state capture
    return [];
  }

  private redrawCanvas(actions: any[]): void {
    actions.forEach((action) => this.handleIncomingDrawing(action));
  }
}
