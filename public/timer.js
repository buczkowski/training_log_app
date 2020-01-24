/* 
This code is based on a project in The New Modern Javascript Bootcamp (2020)
https://www.udemy.com/course/javascript-beginners-complete-tutorial/
*/

class Timer {
  constructor(durationInput, startButton, pauseButton, callBacks){
      this.durationInput = durationInput;
      this.startButton = startButton;
      this.pauseButton = pauseButton;
      if (callBacks) {
          this.onStart = callBacks.onStart;
          this.onTick = callBacks.onTick;
          this.onComplete = callBacks.onComplete;
      }

      this.startButton.addEventListener('click', this.start);
      this.pauseButton.addEventListener('click', this.pause);
  }

  start = () => {
      if (this.onStart) {
          this.onStart(this.timeRemaining);
      }
      this.tick();
      this.interval = setInterval(this.tick, 50);
  };

  pause = () => {
      clearInterval(this.interval);
  }

  tick = () => {
      if (this.timeRemaining <= 0) {
          this.pause();
          if (this.onComplete) {
              this.onComplete();
          }
      }
      else {
          this.timeRemaining = this.timeRemaining - .05;
          if (this.onTick) {
              this.onTick(this.timeRemaining);
          }
      }
  }

  get timeRemaining() {
      return parseFloat(this.durationInput.value);
  }

  set timeRemaining(time) {
      this.durationInput.value = time.toFixed(2);
  }
}