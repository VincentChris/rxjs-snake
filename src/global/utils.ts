import { checkCollision, getRandomPosition } from './canvas';
import { APPLE_COUNT, SNAKE_LENGTH } from './constants';
import {Point2D, Scene} from './type';

export function generateSnake() {
  let snake: Array<Point2D> = [];

  for (let i = SNAKE_LENGTH - 1; i >= 0; i--) {
    snake.push({ x: i, y: 0 });
  }

  return snake;
}
export function move(
  snake: Point2D[],
  [direction, snakeLength]: [Point2D, number]
) {
  let nx = snake[0].x;
  let ny = snake[0].y;

  nx += direction.x;
  ny += direction.y;

  let tail;

  if (snakeLength > snake.length) {
    tail = { x: nx, y: ny };
  } else {
    tail = snake.pop();
    tail!.x = nx;
    tail!.y = ny;
  }

  snake.unshift(tail!);

  return snake;
}

export function isGameOver(scene: Scene) {
  let snake = scene.snake;
  let head = snake[0];
  let body = snake.slice(1, snake.length);

  return body.some(segment => checkCollision(segment, head));
}

export function eat(apples: Array<Point2D>, snake: Array<Point2D>) {
  let head = snake[0];

  for (let i = 0; i < apples.length; i++) {
    if (checkCollision(apples[i], head)) {
      apples.splice(i, 1);
      return [...apples, getRandomPosition(snake)];
    }
  }

  return apples;
}

export function generateApples(): Array<Point2D> {
  let apples = [];

  for (let i = 0; i < APPLE_COUNT; i++) {
    apples.push(getRandomPosition());
  }

  return apples;
}
