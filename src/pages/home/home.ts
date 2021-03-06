import { Component, ViewChild } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
// import { AudioContext } from 'angular-audio-context';

declare var audioinput;
declare var window: any;
var myComponent;
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  audioCtx;
  analyser;
  bufferLength;
  canvas;
  canvasCtx;
  dataArray;
  source;
  stream: MediaStream;
  distortion;
  gainNode;
  biquadFilter;
  convolver;
  test;
  drawVisual;

  
  
  // bufferSize
  constructor(public navCtrl: NavController,
    private platform: Platform,
  ) {

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // this.audioCtx =  audioContext;
    console.log('this.audioCtx: ' + this.audioCtx);


    this.analyser = this.audioCtx.createAnalyser();

    // console.log('this.analyser: ' + this.analyser);
    console.log('this.analyser: ' + JSON.stringify(this.analyser));
    console.log('this.analyser.frequencyBinCount: ' + JSON.stringify(this.analyser.frequencyBinCount));

    // this.source = this.audioCtx.createMediaStreamSource(this.stream);
    // this.source.connect(this.analyser);
    // this.analyser.connect(this.distortion);

    // this.analyser.fftSize = 256;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.85;

    this.distortion = this.audioCtx.createWaveShaper();
    this.gainNode = this.audioCtx.createGain();
    this.biquadFilter = this.audioCtx.createBiquadFilter();
    this.convolver = this.audioCtx.createConvolver();

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    console.log('this.bufferLength: ' + JSON.stringify(this.bufferLength));
    this.analyser.getByteTimeDomainData(this.dataArray);


  }
  ionViewDidLoad() {
    console.log('in ionViewDidLoad');
    // set up canvas context for visualizer
    // Get a canvas defined with ID "oscilloscope"
    this.canvas = document.getElementById("oscilloscope");
    this.canvasCtx = this.canvas.getContext("2d");

    this.test = 1;

    // Listen to audioinput events 
    myComponent = this;
    window.addEventListener("audioinput", this.onAudioInput, false);
    // Listen to audioinputerror events 
    window.addEventListener("audioinputerror", this.onAudioInputError, false);

    this.capture();
    // DrawBars();
  }

  capture() {
    // Start capturing audio from the microphone 
    if (this.platform.is('cordova')) {
      audioinput.start({
        // Here we've changed the bufferSize from the default to 8192 bytes. 
        bufferSize: this.bufferLength,
        normalize: true,
        normalizationFactor: 1024,
        streamToWebAudio: true,

        // Used in conjunction with streamToWebAudio. If no audioContext is given, 
        // one (prefixed) will be created by the plugin.
        audioContext: this.audioCtx,
      });

      audioinput.connect(this.analyser);
      this.analyser.connect(this.distortion);
      this.distortion.connect(this.biquadFilter);
      this.biquadFilter.connect(this.convolver);
      this.convolver.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.visualize();
      // this.voiceChange();

    }

    // Stop capturing audio input 
    // audioinput.stop()
  }

  onAudioInput(evt) {
    // console.log('myComponent.test: ' + JSON.stringify(myComponent.test) );
    // console.log('myComponent.analyser.frequencyBinCount: ' + JSON.stringify(myComponent.analyser.frequencyBinCount));

    // 'evt.data' is an integer array containing raw audio data 
    //    
    // console.log("Audio data received: " + evt.data.length + " samples");
    myComponent.dataArray = evt.data;
    // myComponent.draw();
    // ... do something with the evt.data array ... 

    // draw();
    // DrawBars();
  }



  onAudioInputError(error) {
    alert("onAudioInputError event recieved: " + JSON.stringify(error));
  };



  draw() {

    var drawVisual = requestAnimationFrame(this.draw);

    this.analyser.getByteTimeDomainData(this.dataArray);

    this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    this.canvasCtx.beginPath();

    var sliceWidth = this.canvas.width * 1.0 / this.bufferLength;
    var x = 0;

    for (var i = 0; i < this.bufferLength; i++) {

      var v = this.dataArray[i] / 128.0;
      var y = v * this.canvas.height / 2;

      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.canvasCtx.stroke();
  }

  // distortion curve for the waveshaper, thanks to Kevin Ennis
  // http://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion

  makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for (; i < n_samples; ++i) {
      x = i * 2 / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };

  
visualize() {
  var WIDTH = this.canvas.width;
  var HEIGHT = this.canvas.height;
  var component = this;

  // var visualSetting = visualSelect.value;
  var visualSetting = 'frequencybars';
  console.log(visualSetting);

  if(visualSetting == "sinewave") {
    this.analyser.fftSize = 2048;
    var bufferLength = this.analyser.fftSize;
    console.log(bufferLength);
    var dataArray = new Uint8Array(bufferLength);

    this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
    var drawWaves = function() {

      component.drawVisual = requestAnimationFrame(drawWaves);

      component.analyser.getByteTimeDomainData(dataArray);

      component.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      component.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      component.canvasCtx.lineWidth = 2;
      component.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      component.canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          component.canvasCtx.moveTo(x, y);
        } else {
          component.canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      component.canvasCtx.lineTo(component.canvas.width, component.canvas.height/2);
      component.canvasCtx.stroke();
    };

    drawWaves();

  } else if(visualSetting == "frequencybars") {
    this.analyser.fftSize = 256;
    bufferLength = this.analyser.frequencyBinCount;
    console.log(bufferLength);
    dataArray = new Uint8Array(bufferLength);

    this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    var drawBars = function() {
      component.drawVisual = requestAnimationFrame(drawBars);

      component.analyser.getByteFrequencyData(dataArray);

      component.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
      component.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        component.canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        component.canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

        x += barWidth + 1;
      }
    };

    drawBars();

  } else if(visualSetting == "off") {
    this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    this.canvasCtx.fillStyle = "red";
    this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  }

}

voiceChange() {

  this.distortion.oversample = '4x';
  this.biquadFilter.gain.value = 0;
  this.convolver.buffer = undefined;

  var voiceSetting = 'off';
  console.log(voiceSetting);

  if(voiceSetting == "distortion") {
    this.distortion.curve = this.makeDistortionCurve(400);
  } else if(voiceSetting == "convolver") {
    // this.convolver.buffer = this.concertHallBuffer;
  } else if(voiceSetting == "biquad") {
    this.biquadFilter.type = "lowshelf";
    this.biquadFilter.frequency.value = 1000;
    this.biquadFilter.gain.value = 25;
  } else if(voiceSetting == "off") {
    console.log("Voice settings turned off");
  }

}

// event listeners to change visualize and voice settings

// visualSelect.onchange = function() {
//   window.cancelAnimationFrame(this.drawVisual);
//   this.visualize();
// }

// voiceSelect.onchange = function() {
//   this.voiceChange();
// }


}

/*

function draw() {
  var u8array = new Uint8Array(myComponent.dataArray);

  myComponent.analyser.getByteTimeDomainData(u8array);

  myComponent.canvasCtx.fillStyle = 'rgb(0,0,0)';
  myComponent.canvasCtx.fillRect(0, 0, myComponent.canvas.width, myComponent.canvas.height);

  myComponent.canvasCtx.lineWidth = 2;
  myComponent.canvasCtx.strokeStyle = 'rgb(0, 255, 0)';

  myComponent.canvasCtx.beginPath();

  var sliceWidth = myComponent.canvas.width * 1.0 / myComponent.bufferLength;
  var x = 0;

  for (var i = 0; i < myComponent.bufferLength; i++) {

    var v = myComponent.dataArray[i] / 128.0;
    var y = myComponent.canvas.height - (v * myComponent.canvas.height / 2);

    if (i === 0) {
      myComponent.canvasCtx.moveTo(x, y);
    } else {
      myComponent.canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  myComponent.canvasCtx.lineTo(myComponent.canvas.width, myComponent.canvas.height / 2);
  myComponent.canvasCtx.stroke();
}

function DrawBars() {
  var u8array = new Uint8Array(myComponent.bufferLength);
  var drawVisual = requestAnimationFrame(DrawBars);

  myComponent.analyser.getByteFrequencyData(u8array);

  myComponent.canvasCtx.fillStyle = 'rgb(0,0,0)';
  myComponent.canvasCtx.fillRect(0, 0, myComponent.canvas.width, myComponent.canvas.height);

  var barWidth = (myComponent.canvas.width / myComponent.bufferLength) * 2.5;
  var barHeight;
  var x = 0;
  for (var i = 0; i < myComponent.bufferLength; i++) {
    barHeight = myComponent.dataArray[i] / 2;

    myComponent.canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
    myComponent.canvasCtx.fillRect(x, myComponent.canvas.height - barHeight / 2, barWidth, barHeight);

    x += barWidth + 1;
  }
}

   */