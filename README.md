# Snek: a web-based multiplayer Snake

Snek is a web-based, multiplayer version of Snake, using a JavaScript server (running using Node.js) and a simple HTML, CSS, and jQuery/plain JS client that connects to the server using websockets.

If that sounds a little complicated: don't worry! The important part is this:

![snakes on a plane!](https://raw.githubusercontent.com/flukeout/snek/gh-pages/client/images/favicon.png)
 

## Table of Contents

1. [Getting set up](#1-getting-set-up)
	1. [Prerequisites](11-prerequisites)
    2. [Getting the code](12-getting-the-code)
    3. [First-time installation](13-first-time installation)
    4. [Running the game](14-running-the-game)
    5. [Running the game with more than one person](15-running-the-game-with-more-than-one-person)
2. [Aspects of game play](2-aspects-of-game-play)
3. [Diving into the code](3-diving-into-the-code)
	1. [The game loop](31-the-game-loop)
	2. [The server code](32-the-server-code)
	3. [The client code](33-the-client-code)
	4. [The touchpad code](34-the-touchpad-code)
4. [Troubleshooting and help](4-troubleshooting-and-help)
5. [License information (boring, but important)](5-license-information)


## 1. Getting set up

In order to get set up, you will need to run through a few steps that involve getting the code and running it on your system. Let's begin with the information that everything Snek-related can be found on [https://github.com/flukeout/snek](https://github.com/flukeout/snek), and then cover what you'll need to do in order to get set up, yourself.

### 1.1. Prerequisites

Snek can run on any computer that can run [Node.js](https://nodejs.org), so the first thing to do will be to get yourself a copy of Node by clicking on the Node.js link, and downloading Node.js for yourself.

*WARNING: If you have a tablet like an iPad or an Android tablet, you will not be able to run the Snek game server, but you will be able to play someone else's game using any modern browser app on your tablet* 

The Node.js website should automatically pick up which Operating System your computer uses (windows, OSX, Linux, etc), and give you the appropriate download link.

With Node.js installed, we can move on to the next step. 

### 1.2. Getting the code

There are two ways to get the code. The easy way, and the hard way, so let's look at the easy way first:

#### 1.2.1. Download the code as a zip file

Click on this link: [https://github.com/flukeout/snek/archive/gh-pages.zip](https://github.com/flukeout/snek/archive/gh-pages.zip), which will download a zipped archive onto your computer. You can unpack this file which should create a directory/folder called `snek-gh-pages` with all the files you need inside of it. You can delete the `gh-pages.zip` file after unpacking it.

#### 1.2.2. "Cloning" the code

If you are familiar with [git](https://git-scm.com) you can also clone the code repository yourself. If you use the git desktop client, you can click here to make the desktop client do everything you need: [github-windows://openRepo/https://github.com/flukeout/snek](github-windows://openRepo/https://github.com/flukeout/snek), or if you prefer to work with the terminal, navigate to whatever directory you like to use as "root" for code projects, and then run the git clone command:   

```
$> git clone https://github.com/flukeout/snek
```

You are now ready to move on to the next step.

### 1.3. First-time installation

Whichever of the download approaches you used, you will need to do the next bit in a terminal (unix, linux, OSX) or command prompt (windows).

#### 1.3.1. Unix, Linux, OSX

If you use unix, linux, or OSX, open a terminal and `cd ` your way to the directory where the code for Snek can be found. If you used the download option, this will be that `snek-gh-pages` directory, and if you used `git` it will just be `snek`.

#### 1.3.2. Windows

If you use Windows, open a command prompt (windows menu, then just type "cmd" and run that) and then `cd ` your way to the folder where the code for Snek can be found. If you used the download option, this will be that `snek-gh-pages` folder, and if you used `git` it will just be `snek`.

#### 1.3.3. And then for everybody:

When you're in the Snek directory, you need to run `npm` (a handy task runner that you get when you install Node.js) in the following manner:

```
$> npm install
``` 

(The prompt part may not look exactly like `$>` but it's the most concise way to represent a prompt for every possible OS out there).

So: pretty easy, right? This will automatically fetch all the bits of code that we didn't write ourselves, but are necessary to make sure we can run the Snek game server. We only need to do this once.

### 1.4. Running the game  

Whenever you want to play Snek, you will have to go to your Snek directory/folder, and then use `npm` again to start everything off. Where installation was `npm install`, for just starting everything up the command is slightly different, but still pretty easy:

```
$> npm start
```

This will show you something like:

```
$> npm start


> snek-1@1.0.0 start ~/git projects/snek
> node server/server.js

listening on *:3000
```

That last line means that you can now connect to the game with your browser, by using either of the following two URLs:

- [http://localhost:3000](http://localhost:3000)
- [http://127.0.0.1:3000](http://127.0.0.1:3000)

This makes your browser connect to the game server that you are now running, on port 3000 (ports are a way to distinguish "who the data belongs to" - typically web servers use port 80, or port 421 if they use a secure connection, email uses port 25 or 465 for secured connections, etc. There are about 65 thousand ports available, only a few of which are commonly used for specific things, and port 3000 is one of the "free for whatever you need" port numbers).


Once you've connected your browser to the game, you'll get a game board and you can start playing snek!

### 1.5. Running the game with more than one person

Once you've started up your game server, other people can join your game too, because playing Snek on your own isn't as much fun as playing it against one or more other people.

In order to get others to join the game your computer is hosting, they will need to point their browser to http://your-computer-ip-on-the-network:3000, where the "your-computer-ip-on-the-network" depends entirely on how you are connected to the internet, or local area network.

Explaining how to find out what this is and how to make sure other people can connect to your computer is beyond the scope of this instruction document, because every Operating System has its own way of managing network connections and security (especially now that most computers quite wisely come with software firewalls to prevent people from connecting to your machine unless you specifically allow that). However, you should be able to find instruction by searching the web that work specifically for your Operating System, or maybe you can ask someone you know how to make sure this will work.

Once your computer can be accessed on port 3000, others can directly connect to your game and you will see multiple players in the browser. The game is on! 

## 2. Aspects of game play

The main controls are explained when you connect to Snek in your browser:

- Arrow keys move your snake around.
- The "b" button on your keyboard will drop the last segment of your snake as a bomb. Bombs let you do cool things, but be careful not to drop too many, because you can only win by getting long enough!
- The "n" button on your keyboard lets you change your name. By default you will be something unoriginal like "snake_14" so while you're not moving it's a good idea to press that "n" button and give yourself a cool name!
- You can press the "enter" button on your keyboard to send a chat message to everyone. These messages will briefly show up above your snake while you're playing; There is no dedicated chat log: you're in it to win it, not to discuss works of literature, get back to the game and bomb your friends O_O!

## 3. Diving into the code

Snek works by having a game server running on a computer, and having "clients" connect to the game server via [web sockets](). All the actual game logic (e.g. how many players there are, where they are on the board, where someone has dropped a bomb, etc) is handled in the server code, and clients simply get updates as things happen: for instance, if someone presses the up arrow, they send a command "I want change my snake direction to "up" now" to the server, which processes the instruction, and then sends out that directional change for that player to everyone connected to the game, *including* the player who just changed direction. 

This is called a "thin" client, or even "dumb" client approach, which is a bit of a misleading name: as long as the messages passed back and forth between the server and the clients are small, this is a super effective way to make a multiplayer game work. 

### 3.1 The game loop

The most important concept in games is the game loop, which determines what happens from moment to moment. As a server-based multiplayer game, Snek has its game loop running on the server, and sends out updates to all clients that are connected to it.

The server game loop looks a bit like this:

1. loop run start
2. process all pending player instructions (movement, bombs, etc) since the last time the loop was run.
3. send out the new game state to every connected player
4. schedule another loop run to start a little bit in the future

The client doesn't use a game loop, but rather acts on two things: events received from the server, and events generated by the player, to be sent to the server. The client is essentially in an "always waiting" mode, and does the following:

- if a player presses a button, convert that to a specific action event and send that event to the server. Do nothing else
- if an event is received from the server, look at which action is associated with the event, and run it.

Action events from the server can be things like "redraw all snakes in new positions" or "show a bomb going off", or "show a message sent by a user", etc.

Note that this also means the client always has to wait for the server to act: if you press "up" on your keyboard, the client sends that to the server as a "this player wants to change direction" - *technically* the server could deny your request to change direction and you would keep moving in the direction you were already travelling! However, the server won't do that, it will see your request to change direction, process that request during its game loop, update your snake position and direction as part of its update process, and then tell everyone, including you, what the new snake positions are.

So while it looks like you're pressing up, and your snake moves up, things are actually a little more complicated, but only a little more. 


### 3.2. The server code

In this section we'll look at how the server works, and which files house code for which part of the game.

All the code for the game server lives in the `./server` directory, with the code organised over several files named (mostly) for what they do for the game. The code for the server uses code that follows the "commonjs" conventions, which is a fancy way to say it's the kind of JavaScript that Node.js can work with. It's mostly the same as standard browser JavaScript, but it has a nice way to "require" in code from files with a single command, and by extension has some conventions on what files need to declare in order to be usable in a "require" construction. 

#### 3.2.1. server.js

The master file that runs the server, even though that's kind of all it does, is `server.js`. This file creates a simple webserver (we use [express](https://expressjs.com) for this) that works as central coordination point for all the clients that want to connect to the game.

It doesn't really do all that much more.

#### 3.2.2. game.js - the main game logic

This is where the bulk of the game logic lives. `game.js` defines an object called `Game`, which is created with a reference to the active websocket library and an (initially empty) list of players, and knows how to do things like handling settings for the current game round, adding and removing players to the active game, planting and exploding bombs, generating apples for the players to "eat", as well as perfoming the essential game loop logic of "seeing if players have collided with things or each other", "computing who is affected by a bomb going off" and all that jazz.

The `game.js` file exports a small function that takes the arguments you need to create a new game, builds the game, and then immediately starts it up so that you (or, all of us) don't have to manually get things started. Things start "automatically".

The most important function inside the `Game` object is the `move()` function, which advances the gameplay by one step.

#### 3.2.3. snake.js - where snake administration happens

The `snake.js` file defines an object called `Snake`, which is the code representation of anything a player's snake might do.

Each snake has a ton of meta-data, like position of the head, how many segments it consists of, player name and color, event queues for handling changes in snake direction that players send to the server in between game loop ticks, the current score, and so on and so forth.

As in the `Game` object, the most important function in the `Snake` object is the `move()` function, which computes, for each individual snake, where it will end up on the next step in the game, so that that information can be used to determine whether any collisions have occurred, etc.

#### 3.2.4. sockets.js - the part that lets us listen to player actions

The fourth important file is `sockets.js`, which defines all the messages from players we can listen for, so that the game logic can "do things" based on them. For instance, the very first protocol message we can listen for is the `"connection"` message, which we receive when a player connects to the game by opening up the game client in their browser. That's an important message! When we see it, we can tell the game to create a local model for that player, and create an associated `Snake` for then, so that they can be part of the game.  

Other examples of messages the server listens to from players are things like the `"changeName"` message, for players changing their name, or `"direction"` and `"releaseDirection"`, which record a player pressing a directional key on their keyboard, and a player releasing a directional key on their keyboard, respectively. 

#### 3.2.5. The other files

There are a few more files in the server directory, but these are all tiny files with commonly used, handy utility functions. We could have put the code for those in each thing that makes use of it, but it's generally better to only write code that you need in many places once, and then "require" that code in many places, than it is to copy and paste the same code in lots of places: if you ever need to make a change, now you only need to make changes in one places, instead of in all those places if you'd copy-pasted the code. 

### 3.3. The client code

In this section we'll look at how the client code works, and which files house code for which parts of the playable part of the game.

All the code for the game client lives in the `./client` directory, with the code organised over several files named (mostly) for what they do for the game. The client is written mostly using plain HTML and CSS, with plain JavaScript in most places, and [jQuery](http://jquery.com) where the client UI needs to be updated or examined.

Some of the code-we-just-need is housed in the `./client/lib` directory - you can have a look at the code in there, but most of it is simply external libraries like jQuery, or [LESS](http://lesscss.org) (for writing CSS with a little bit more freedom) and the like.

Note that the client is a super "dumb" client: none of the code is responsible for making things actually happy in the game, it's all purely for showing what the game that's running on the server is supposed to look like, and for getting events generated by the player (arrow keys, name changes, etc) to the server, so that it can work the into the running game. 

#### 3.3.1. game.js - for drawing "what happens in the game"

The `game.js` file is used to draw the game board/grid, as well as things like apples, bombs, snakes, scores, and all that. Whenever the client receives an update event from the server, `Game` functions are called to make sure that the thing we're supposed to draw (or remove!) get drawn (...or removed).

#### 3.3.2. snake.js - for handing off "drawing snake stuff"

While `game.js` *could* do all the snake drawing as well, since there's a fair amount of code involved with drawing snakes all the code for the snakes is housed in a special `snake.js` file. 

#### 3.3.3. handle-keys.js - for capturing player input

The `handle-keys.js` file is used to listen for key events in the browser, so that things like arrow keys for direction, "b" for dropping a bomb, "n" for changing your name, and "enter" for starting a chat message can be properly dealt with.

This is a secondary handler file, `handle-events.js` which adds some additional keydown/keyup monitoring for triggering things in the client. If you can't find the thing you're looking for in `handle-keys.js`, it's probably in `handle-events.js`.

#### 3.3.4. sockethandling.js - for listening for server events

In order for our client to update itself based on the current game information on the server, we need to listen to all the messages the server will send us, which we do in `sockethandling.js`. If you look at this file you will see things like "on a `newChat` message, show a snake saying that message" and "on a `serverTick` message, update our snake and then draw the updated game situation.

Important stuff!

#### 3.3.5. chat.js - for... err... chatting?

The UI for chatting and how data is handled for that is all found in `chat.js` - it's a pretty self-contained system, so rather than putting it `game.js`, much like `snake.js` we put it in its own file.

#### 3.3.6. scoreboard.js - for keeping score

Like snakes and chats, the scoreboard at the end of a round is also housed in its own file.

#### 3.3.7 drawparticles.js - for super cool particle effects!

While just plain graphics are alright, for things like bombsplosions you want some cool visual effects, which is achieved by calling the `drawParticles` function from `drawparticles.js`. If you open this file there isn't a lot in there, and that's because it farms out all the hard work to the `particles.js` library in `./client/lib`.

#### 3.3.8. the other files

The other files in the directory are again assorted small functions, much like for the server.

### 3.4. The touchpad code

In addition to a regular game client, there's also a "UI-less" client that acts as a game controller so that you can play the game on a projector and simply look at your snake on the big screen, while controlling it through your browser, without having to *look* at your browser. It's super fun!

Of course, this requires none of the code for visualising the game board, and snakes, and scores, and chat, all that, so the code is a single file: `pad.js`, with the HTML and CSS for setting up a mostly blank page.

## 4. Troubleshooting and help

In case you run into problems running the code, or working on it, you can check the issue tracker over on https://github.com/flukeout/snek/issues to see if someone else is having the same problem. If you can't find it: "file it!" - if you're logged into github you can click the green "new issue" button to let us know that you're having problems with snakes.


## 5. License information

Some of the code and some of the files used by Snek come with a license: that's not necessarily a bad thing, licenses are an explicit way to say what people can and cannot do with code and assets in a programming project. Especially if you want to let people know that the code and the assets are free, it is important to make sure that there is an accompanying license that says so: if you don't, then in many countries the law treats your code and assets as "all rights reserved", and no one can do anythying with them!

So, the following is a list of parts of the Snek code, and the assets that are used, and the licenses that apply to them.

(that list needs to still be compiled =)
