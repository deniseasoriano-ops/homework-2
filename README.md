# homework-2
Farmer Harvest Game

Extension of the provided Farmer Harvest JavaScript game

NEW FEATURES IMPLEMENTED

The two requested additional features are as follows:

1 - Moving obstacle with penalty
Two flying crows that move randomly around the screen and reduce the alotted time by 5 seconds if the farmer (player) collides into them, then regenerates somewhere random on the screen
2 - Temporary speed boost power up
A small blue circle will periodically generate at a random place on the screen, providing a 1.5x speed boost for 3 seconds should the farmer "collect" it


HOW TO RUN THE GAME

1 - Extract the files from the homework-2.zip into a folder. Alternatively, you can save each individual uploaded file into the same directory (index.html, style.css, main.js, Game.js, Crop.js, and Farmer.js).
2 - Open index.html in a browser once you are sure that all of the necessary files are downloaded and located in the same directory.
3 - Click "Start" to begin playing the game.


ARROW FUNCTIONS, BIND, AND THIS

Explanatory comments about "this" can be found in main.js:
1 - RAF loop: In the Game constructor, the tick method is an arrow function, which ensures that the "this" inside the loop refers correctly to the Game instance
2 - Event listener: In the Input constructor, "this" inside the "onKeyDown" method usually refers to ibject "window", but using ".bind(this)" makes it refer to the correct "Input" instance
3 - Method reference: Passing "this._onKeyDown" to "addEventListener" is passing a method reference, so it is necessary to find it first to prevent losing context when called by the event listener

Use of ".bind(this)"
1 - Input Class constructor: Used so that the "onKeyDown" method still has "this" bound to Input instance when called by the "window" event listener
2 - Game Class constructor: Used for the same reason, to make sure that the "onResize" method is still correctly connected to the Game instance

Arrow functions used throughout the project for anonymous callbacks
1 - Array processing: In Game.update(), arrow functions are used for .filter(), .forEach(), and .find()
2 - Event handlers: In Game construcotr, arrow functions are used for this.start()
