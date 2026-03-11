import { TestBed } from '@angular/core/testing';
import { ScrollService } from './scroll.service';
import { firstValueFrom } from 'rxjs';
import { take, skip, bufferCount } from 'rxjs/operators';

describe('ScrollService', () => {
  let service: ScrollService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('scrollToPost$', () => {
    it('should initially emit null', async () => {
      const value = await firstValueFrom(service.scrollToPost$);
      expect(value).toBeNull();
    });

    it('should emit the postId when scrollToPost is called', async () => {
      const promise = firstValueFrom(service.scrollToPost$.pipe(skip(1), take(1)));
      service.scrollToPost('post-42');
      const value = await promise;
      expect(value).toBe('post-42');
    });

    it('should reset to null after ~100ms', async () => {
      vi.useFakeTimers();
      const values: (string | null)[] = [];
      const sub = service.scrollToPost$.subscribe((v) => values.push(v));

      service.scrollToPost('post-99');
      vi.advanceTimersByTime(100);

      // initial null, then 'post-99', then null again
      expect(values).toEqual([null, 'post-99', null]);

      sub.unsubscribe();
      vi.useRealTimers();
    });
  });

  describe('refresh$', () => {
    it('should emit when refresh() is called', async () => {
      const promise = firstValueFrom(service.refresh$);
      service.refresh();
      const value = await promise;
      expect(value).toBeUndefined();
    });

    it('should emit multiple times on multiple refresh() calls', async () => {
      const promise = firstValueFrom(service.refresh$.pipe(bufferCount(3)));
      service.refresh();
      service.refresh();
      service.refresh();
      const values = await promise;
      expect(values).toHaveLength(3);
    });
  });
});
