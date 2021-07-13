import {FPS, POINTS_PER_APPLE} from '../global/constants';
import {Point2D} from '../global/type';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  animationFrameScheduler,
  BehaviorSubject,
  combineLatest,
  fromEvent,
  interval,
  Observable,
  of,
} from 'rxjs';
import {
  distinctUntilChanged,
  filter, first,
  map,
  scan,
  share,
  skip,
  startWith, switchMap, takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  nextDirection,
  renderGameOver, renderScene,
} from '../global/canvas';
import {
  DIRECTIONS,
  INITIAL_DIRECTION,
  SNAKE_LENGTH,
} from 'src/global/constants';
import {eat, generateApples, generateSnake, isGameOver, move} from 'src/global/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvas')
  canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  CANVAS_WIDTH = CANVAS_WIDTH;
  CANVAS_HEIGHT = CANVAS_HEIGHT;
  private keydown$ = fromEvent<KeyboardEvent>(document, 'keydown');
  private click$!: Observable<Event>;

  private createGame = (fps$: Observable<number>) => {
    const direction$ = this.keydown$.pipe(
      map((event: KeyboardEvent) => DIRECTIONS[event.keyCode]), // 将用户输入的案件keycode转成对应的坐标点方向
      filter((direction) => !!direction), // 由于用户输入的可能不是上下左右，所以需要过滤无效的按键输入
      startWith(INITIAL_DIRECTION), // 给一个初始的方向
      scan(nextDirection), // 过滤掉用户输入对立方向的操作 （如：本来的行走方向是右，然后用户输入的左方向）
      distinctUntilChanged() // 当数据(方向)改变时，数据才往下流
    );

    const length$ = new BehaviorSubject<number>(SNAKE_LENGTH);//记录长度

    // 蛇的长度
    const snakeLength$ = length$.pipe(
      scan((step, snakeLength) => snakeLength + step),
      share()
    );
    //分数
    const score$ = snakeLength$.pipe(
      startWith(0),
      scan((score, _) => score + POINTS_PER_APPLE)
    );
    //记录蛇的坐标
    const snake$ = interval(200).pipe(
      withLatestFrom<number, Observable<Point2D>, Observable<number>, [Point2D, number]>
      (direction$, snakeLength$, (_, direction, snakeLength) => [direction, snakeLength,]),
      scan(move, generateSnake()),
      share()
    );
    // 记录苹果的坐标
    const apples$ = snake$.pipe(
      scan(eat, generateApples()),
      distinctUntilChanged(),
      share()
    );
    // 苹果被吃掉的流
    apples$
      .pipe(
        skip(1),
        tap(() => length$.next(POINTS_PER_APPLE)) // 吃掉一个苹果，蛇要增加相应的长度
      )
      .subscribe();
    // 场景，包括蛇，苹果，分数
    const scene$ = combineLatest([snake$, apples$, score$]).pipe(
      map(([snake, apples, score]) => ({snake, apples, score}))
    );

    return fps$.pipe(
      withLatestFrom(scene$, (_, scene) => scene)
    );
  }

  private game$ = of('Start Game').pipe(
    map(() => interval(1000 / FPS, animationFrameScheduler)),
    switchMap(this.createGame),
    takeWhile(scene => !isGameOver(scene))
  )

  private startGame() {
    this.game$.subscribe({
      next: (scene) => renderScene(this.ctx, scene),
      complete: () => {
        renderGameOver(this.ctx)
        this.click$.pipe(
          first()
        ).subscribe(() => {
          this.startGame()
        })

      }
    })
  }

  ngAfterViewInit(): void {
    this.click$ = fromEvent(this.canvas.nativeElement, 'click');
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.startGame()
  }
}
