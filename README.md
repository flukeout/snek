# Snek: a web-based multiplayer Snake

Snek is a web-based, multiplayer version of Snake, using a JavaScript server (running using Node.js) and a simple HTML, CSS, and jQuery/plain JS client that connects to the server using websockets.

If that sounds a little complicated: don't worry! The important part is this:

![snakes on a plane!](https://raw.githubusercontent.com/flukeout/snek/gh-pages/client/images/favicon.png)
 

## Table of Contents

1. [Getting set up](#1. getting set up)
	1. [Prerequisites]()
    2. [Getting the code]()
    3. [First-time installation]()
    4. [Running the game]()
    5. [Running the game with more than one person]()
2. [Aspects of game play]()
3. [Diving into the code]()
	1. [The game loop]()
	2. [The server code]()
	3. [The client code]()
4. [Troubleshooting and help]()
5. [License information (boring, but important)]()


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

- code in `./server`
- expressjs and node
- main game logic in `game.js`
- main snake code in `snake.js`
- websockets protocol in `sockets.js`
-  ...

### 3.3. The client code

In this section we'll look at how the client code works, and which files house code for which parts of the playable part of the game.

- code in `./client`
- plain old HTML, CSS, and jQuery
- some additional libraries in `./lib`
- base game visualisation in `game.js`
- snake visualisation in `snake.js`
- chat functions in `chat.js`
- player event handling in `handle-...` files
- particle effects! They're cool and have their own `drawparticles` file
-  ...

## 4. Troubleshooting and help

(github issues link, FAQ?)

## 5. License information (boring, but important)

(explain which files are licensed under which license, and link to `tl;dr.` versions of each license?)