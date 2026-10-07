import { TestBed } from '@angular/core/testing';
import { StatCard } from './stat-card';
it('renders stat label, value and explanation', async () => {
  const fixture = TestBed.createComponent(StatCard);
  fixture.componentRef.setInput('label', 'AVISOS'); fixture.componentRef.setInput('value', '3'); fixture.componentRef.setInput('detail', 'Emails aceitos');
  fixture.detectChanges(); await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('AVISOS'); expect(fixture.nativeElement.textContent).toContain('3'); expect(fixture.nativeElement.textContent).toContain('Emails aceitos');
});
