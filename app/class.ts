import { Sema } from "@aldlss/async-sema";

interface ConstructorOptions<T> {
  initFn: () => T;
  pauseFn: () => void;
  resumeFn: () => void;
  capacity: number;
}

// 做这个是为了特化出 T，方便类型推断
export class SemaType<T = "1"> extends Sema {
  constructor(
    nr: number,
    // 限制 initFn 必须要有是因为 Sema 内部实现的原因
    // 如果不指定 initFn，那么内部实现只会传递默认的 "1" 而不是 T 类型的值
    // 但是懂得都懂，就不限制了
    options?: Partial<ConstructorOptions<T>>,
  );
  constructor(nr: number, options: ConstructorOptions<T>);
  constructor(nr: number, options: Partial<ConstructorOptions<T>> = {}) {
    super(nr, options);
  }
  tryAcquire(): T | undefined {
    return (this as any).free?.shift();
  }
  acquire(): Promise<T> {
    return super.acquire();
  }
  release(token?: T): void {
    super.release(token);
  }
  drain(): Promise<T[]> {
    return super.drain();
  }
  nrWaiting(): number {
    return super.nrWaiting();
  }
}

export class ControlledPromise<T = void> {
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: any) => void;
  promise: Promise<T>;
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
