import { Component, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  @ViewChild( 'video' ) videoRef: ElementRef;
  @ViewChild( 'canvas' ) canvasRef: ElementRef;
  @ViewChild( 'faceCanvas' ) faceCanvasRef: ElementRef;

  private video: HTMLVideoElement;
  private videoWidth: number;
  private videoHeight: number;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private faceCanvas: HTMLCanvasElement;
  private faceCtx: CanvasRenderingContext2D;

  private faceDetector: any;

  constructor( private zone: NgZone ) {}

  ngAfterViewInit() {
    // Get references to the video and canvas elements
    this.video = this.videoRef.nativeElement;
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext( '2d' );
    this.faceCanvas = this.faceCanvasRef.nativeElement;
    this.faceCtx = this.faceCanvas.getContext( '2d' );

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

    // Copy the faces to the resized canvas and convert to greyscale
    faces.forEach( face => this.processFace( face ) );

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

  processFace( face: any ) {
    // Resize and draw the face to the smaller canvas
    this.faceCtx.drawImage(
      this.canvas,
      face.boundingBox.x, // The starting x to take from this.canvas
      face.boundingBox.y, // The starting y to take from this.canvas
      face.boundingBox.width, // The width of the rectangle to take from this.canvas
      face.boundingBox.height, // The height of the rectangle to take from this.canvas
      0, // The starting x to draw to on the faceCtx
      0, // The starting y to draw to on the faceCtx
      50, // The width to scale the image to on faceCtx
      50 // The height to scale the image to on faceCtx
    );

    // Convert the resized face to greyscale
    const imageData = this.faceCtx.getImageData(0, 0, 50, 50);
    const pixels = imageData.data;
    for ( let i = 0, n = pixels.length; i < n; i += 4 ) {
      const brightness = pixels[i] * .3 + pixels[i + 1] * .59 + pixels[i + 2] * .11;
      pixels[i] = brightness;
      pixels[i + 1] = brightness;
      pixels[i + 2] = brightness;
    }
    this.faceCtx.putImageData(imageData, 0, 0);
  }

}
