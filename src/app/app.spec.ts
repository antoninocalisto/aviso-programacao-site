import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { App } from './app';
describe('dashboard integration', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [App], providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('renders pending configuration without claiming monitoring is active', async () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/status').flush({ configured: false, initialized: false, checks: 0, notifications: 0, history: [], lastError: null });
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Configuração pendente');
    expect(fixture.nativeElement.textContent).toContain('antuninosantos@gmail.com');
  });
  it('renders history and refreshes status through the API', async () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/status').flush({ configured: true, initialized: true, lastCheckedAt: new Date().toISOString(), notifications: 2, history: [{ at: new Date().toISOString(), kind: 'notification', message: 'Email aceito.' }], lastError: null });
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Monitoramento ativo');
    expect(fixture.nativeElement.textContent).toContain('Email aceito.');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    http.expectOne('/api/status').flush({ configured: false, initialized: false, notifications: 0, history: [] });
  });
  it('shows an actionable error when status fails', async () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/status').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Não foi possível atualizar');
  });
});
