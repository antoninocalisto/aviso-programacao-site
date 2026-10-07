import { TestBed } from '@angular/core/testing';
import { ActivityList } from './activity-list';
it('shows the exact text and link changes in expandable details', async () => {
  const fixture = TestBed.createComponent(ActivityList);
  fixture.componentRef.setInput('entries', [{at:'2026-10-07T12:30:00Z',kind:'change',message:'Nova alteração',changes:{addedText:['Nova convocação'],removedText:['Convocação anterior'],addedLinks:['https://example.com/novo.pdf'],removedLinks:[]}}]);
  fixture.detectChanges(); await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Ver o que mudou');
  expect(fixture.nativeElement.textContent).toContain('Nova convocação');
  expect(fixture.nativeElement.textContent).toContain('Convocação anterior');
  expect(fixture.nativeElement.textContent).toContain('https://example.com/novo.pdf');
});
it('explains the empty state before the first check', async () => {
  const fixture = TestBed.createComponent(ActivityList); fixture.componentRef.setInput('entries', []);
  fixture.detectChanges(); await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('O acompanhamento começa aqui');
});
it('shows history with the Brasília timezone and error marker', async () => {
  const fixture = TestBed.createComponent(ActivityList);
  fixture.componentRef.setInput('entries', [{ at: '2026-10-07T12:30:00Z', kind: 'error', message: 'Fonte indisponível.' }]);
  fixture.detectChanges(); await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('07/10/2026, 09:30');
  expect(fixture.nativeElement.textContent).toContain('Fonte indisponível.');
  expect(fixture.nativeElement.querySelector('.error-dot')).toBeTruthy();
});
