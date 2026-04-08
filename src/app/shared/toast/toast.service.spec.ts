import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with no toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast via success()', () => {
    service.success('Done!');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Done!');
  });

  it('should add a toast via error()', () => {
    service.error('Oops');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add a toast via warning()', () => {
    service.warning('Watch out');
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('should add a toast via info()', () => {
    service.info('FYI');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should dismiss a toast by id', () => {
    service.success('A');
    service.error('B');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('B');
  });

  it('should auto-dismiss after default duration', () => {
    service.success('Auto');
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(service.toasts().length).toBe(0);
  });

  it('should use custom duration when provided', () => {
    service.success('Custom', { duration: 1000 });
    vi.advanceTimersByTime(999);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts().length).toBe(0);
  });

  it('should cap visible toasts at 5', () => {
    for (let i = 0; i < 7; i++) {
      service.info(`Toast ${i}`);
    }
    expect(service.toasts().length).toBe(5);
    expect(service.toasts()[0].message).toBe('Toast 2');
    expect(service.toasts()[4].message).toBe('Toast 6');
  });

  it('should use different default durations per type', () => {
    service.success('s');
    service.info('i');
    service.warning('w');
    service.error('e');

    expect(service.toasts()[0].duration).toBe(3000);
    expect(service.toasts()[1].duration).toBe(4000);
    expect(service.toasts()[2].duration).toBe(5000);
    expect(service.toasts()[3].duration).toBe(6000);
  });
});
