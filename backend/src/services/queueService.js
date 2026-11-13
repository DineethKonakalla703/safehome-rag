/**
 * Asynchronous Background Task Queue
 * Provides structured queue execution with concurrency throttling and error handling.
 */

class TaskQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  enqueue(taskFn, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        taskFn,
        metadata,
        resolve,
        reject,
        enqueuedAt: new Date(),
      });
      this.processNext();
    });
  }

  async processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { taskFn, resolve, reject } = this.queue.shift();
    this.running += 1;

    try {
      const result = await taskFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.running -= 1;
      this.processNext();
    }
  }

  get stats() {
    return {
      pending: this.queue.length,
      active: this.running,
      concurrency: this.concurrency,
    };
  }
}

export const backgroundQueue = new TaskQueue(4);
