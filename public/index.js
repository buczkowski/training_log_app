/* 
This code is based on a project in The New Modern Javascript Bootcamp (2020)
https://www.udemy.com/course/javascript-beginners-complete-tutorial/
*/

const durationInput = document.querySelector('#duration');
const startButton = document.querySelector('#start');
const pauseButton = document.querySelector('#pause');

let duration;
const timer = new Timer(durationInput, startButton, pauseButton, {
    onStart(totalDuration) {
        duration = totalDuration;
        document.querySelector('#timeralert').innerHTML = '';
    },
    onTick(timeRemaining) {
    },
    onComplete() {
        const alertP = document.createElement("P");
        const alertText = document.createTextNode("Time for the next set!");
        alertP.appendChild(alertText);
        document.querySelector('#timeralert').appendChild(alertP);
        document.querySelector('#timeralert')
            .setAttribute("style", "background-color: red;");
        document.querySelector('audio').play();
    }
});
