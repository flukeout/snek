
##Methods

####Client will listen for...

When you join, this tells the client how big of a grid to draw and what your player/snake id is...

```
gameSetup = {
  width : 0,
  height: 0,
  id : 0
}
```

When a new snake spawns...
```
spawnSnake = {
  id : 0,
  color: #FFF,
  length: 0,
  x: 0,
  y: 0
}
```

When a snake dies...
```
killSnake = {
  id : 0
}
```

When a player leaves the game...
```
playerDisconnect = {
  id : 0
}
```

When a player joins the game...
```
playerJoin = {
  color : #FFF
}
```

When a snake changes direction...
```
direction = {
  id: 0,
  direction: "left"
}
```

### Client will send...

When the player changes their snake direction...
```
direction = {
  id: 0,
  direction: "left"
}
```
```
respawnSnake = {
  id : 0
}
```

When the player joins the game and wants to spawn
```
makeSnake = {
    
}
```
