/*
This function takes the position of an entity and
returns the position and rotation to spawn to place an object
in front of that entity.
For example, if the user is generating a model, this will take
the position and rotation of the user and thenreturn
the position to place the model in front of the player
*/

interface Coords {
  x: number,
  y: number,
  z: number,
}

const calcSpawnPosition = (position: Coords, rotation: Coords, offsetToSpawn: number = 0) => {
  // const radY = rotation.y * (Math.PI / 180); // Convert Y rotation to radians

  // const newPosition = {
  //   // @ts-ignore
  //   x: position.x + offsetToSpawn * Math.sin(radY),
  //   y: position.y + 1.5, // Adjust to place it at eye level
  //   z: position.z + offsetToSpawn * Math.cos(radY),
  // };

  // return newPosition

  const newPosition = {
    x: position.x,
    y: position.y + 1.5,
    z: position.z,
  }

  return newPosition
}

export default calcSpawnPosition;