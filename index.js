const startGame = () => {
  const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
  const height = window.innerHeight;
  const width = window.innerWidth;
  const cellsHorizontal = 8;
  const cellsVertical = 10;

  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;

  const engine = Engine.create();
  //disable gravity
  engine.world.gravity.y = 0;
  const { world } = engine;

  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      wireframes: false,
      width,
      height,
    },
  });

  Render.run(render);
  Runner.run(Runner.create(), engine);

  // const shape = Bodies.rectangle(200, 200, 50, 50, {
  //   isStatic: true,
  // });

  // World.add(world, shape);

  //walls(bordurat)
  const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }), //top
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }), //bottom
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }), //left
    Bodies.rectangle(width, width / 2, 2, height, { isStatic: true }), //right
  ];

  //shtojm katrorin
  World.add(world, walls);

  //Maze generation

  //#1 for loop
  // const grid = [];

  // for (let i = 0; i < 3; i++) {
  //   grid.push([]);
  //   for (let j = 0; j < 3; j++) {
  //     grid[i].push(false);
  //   }
  // }

  // console.log(grid);

  //#2 Array

  const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);

      counter--;

      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }
    return arr;
  };

  //Grid

  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  const stepThroughCells = (row, column) => {
    //if i have visited the cell at [cell, row] then return
    if (grid[row][column]) {
      return;
    }
    //Mark this cell as being visited
    grid[row][column] = true;
    //Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
      [row - 1, column, 'up'], //above
      [row, column + 1, 'right'], //right
      [row + 1, column, 'down'], //below
      [row, column - 1, 'left'], //left
    ]);

    //For each neighbor...
    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;
      //see if that neighbor is out of bonds
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal
      ) {
        continue;
      }
      //if we have visited that neighbour countinue to the next neighbor
      if (grid[nextRow][nextColumn]) {
        continue;
      }
      //remove a wall from either horizontals or verticals
      if (direction === 'left') {
        verticals[row][column - 1] = true;
      } else if (direction === 'right') {
        verticals[row][column] = true;
      } else if (direction === 'up') {
        horizontals[row - 1][column] = true;
      } else if (direction === 'down') {
        horizontals[row][column] = true;
      }
      stepThroughCells(nextRow, nextColumn);
    }
    //visit the next cell
  };

  stepThroughCells(startRow, startColumn);

  //horizontals
  horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }
      const wall = Bodies.rectangle(
        //horizontal
        columnIndex * unitLengthX + unitLengthX / 2,
        //row
        rowIndex * unitLengthY + unitLengthY,
        //length
        unitLengthX,
        //tall
        5,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: 'red',
          },
        }
      );
      World.add(world, wall);
    });
  });

  //verticals
  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        5,
        unitLengthY,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: 'red',
          },
        }
      );
      World.add(world, wall);
    });
  });

  //goal
  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
      label: 'goal',
      isStatic: true,
      render: {
        fillStyle: 'green',
      },
    }
  );

  World.add(world, goal);

  //Ball
  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
  const ball = Bodies.circle(
    unitLengthX / 2, //X
    unitLengthY / 2, //Y
    ballRadius, //radius
    {
      label: 'ball',
      render: {
        fillStyle: 'blue',
      },
    }
  );

  World.add(world, ball);

  document.addEventListener('keydown', (e) => {
    const { x, y } = ball.velocity;
    if (e.keyCode === 87) {
      Body.setVelocity(ball, { x, y: y - 5 }); //up
    }
    if (e.keyCode === 65) {
      Body.setVelocity(ball, { x: x - 5, y }); //left
    }
    if (e.keyCode === 83) {
      Body.setVelocity(ball, { x, y: y + 5 }); //down
    }
    if (e.keyCode === 68) {
      Body.setVelocity(ball, { x: x + 5, y }); //right
    }
  });

  //win condition
  Events.on(engine, 'collisionStart', (e) => {
    e.pairs.forEach((collision) => {
      const labels = ['ball', 'goal'];

      if (
        labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
      ) {
        document.querySelector('.winner').classList.remove('hidden');

        world.gravity.y = 1;
        world.bodies.forEach((body) => {
          if (body.label === 'wall') {
            Body.setStatic(body, false);
          }
        });
      }
    });
  });
};

startGame();
