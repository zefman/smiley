import { Component, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  @ViewChild( 'video' ) videoRef: ElementRef;
  @ViewChild( 'canvas' ) canvasRef: ElementRef;

  private video: HTMLVideoElement;
  private videoWidth: number;
  private videoHeight: number;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private faceDetector: any;

  constructor( private zone: NgZone ) {}

  ngAfterViewInit() {
    // Get references to the video and canvas elements
    this.video = this.videoRef.nativeElement;
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext( '2d' );

    // Create a new face detector
    this.faceDetector = new window[ 'FaceDetector' ]( { fastMode: true, maxDetectedFaces: 2 } );

    // Start the webcam
    this.startVideo();
  }

  startVideo() {
    navigator.getUserMedia( {
      video: true,
      audio: false
    }, mediaStream => {
      // Successfully started a media stream, bind it to our video element
      this.video.src = window.URL.createObjectURL( mediaStream );

      // Once the video is loaded set our canvas element to match it's
      // width and height
      this.video.addEventListener( 'loadeddata', () => {
        this.videoWidth = this.video.videoWidth;
        this.videoHeight = this.video.videoHeight;
        this.canvas.height = this.videoHeight;
        this.canvas.width = this.videoWidth;
      } );

      this.zone.runOutsideAngular( () => this.update() );
    }, error => {
      console.log( error );
    } );
  }

  async update() {
    // Detect faces in the video feed
    const faces = await this.faceDetector.detect( this.canvas );

    // Draw the latest frame from the video to canvas
    this.ctx.drawImage( this.video, 0, 0, this.videoWidth, this.videoHeight );

    // Mark the detected faces on the canvas
    this.markFaces( faces );

    // Request the next frame
    requestAnimationFrame( () => this.update() );
  }

  markFaces( faces: any[] ) {
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = 'red';

    faces.forEach( face => {
      this.ctx.beginPath();
      this.ctx.rect(
        face.boundingBox.x,
        face.boundingBox.y,
        face.boundingBox.width,
        face.boundingBox.height
      );
      this.ctx.closePath();
      this.ctx.stroke();
    } );
  }
}
