describe('Role Guards', () => {
  it('redirects unauthenticated user from protected admin route to login', () => {
    cy.visit('/admin/stats');
    cy.url().should('include', '/login');
  });

  it('allows admin user and loads admin stats route', () => {
    cy.intercept('GET', '**/backend/api/admin/waiters', [
      { id: 1, name: 'Admin', email: 'admin@grillhouse.hu', role: 'admin', on_shift: true },
      { id: 2, name: 'Pincér', email: 'waiter@grillhouse.hu', role: 'waiter', on_shift: true },
    ]).as('waiters');

    cy.intercept('GET', '**/backend/api/admin/today-guests', { today_guests: 17 }).as('todayGuests');
    cy.intercept('GET', '**/backend/api/admin/tables', [
      { id: 1, capacity: 4, status: 'free' },
      { id: 2, capacity: 2, status: 'reserved' },
    ]).as('tables');
    cy.intercept('GET', '**/backend/api/admin/daily-revenue', { daily_revenue: 125000 }).as('revenue');
    cy.intercept('GET', '**/backend/api/admin/guest-count-history', [
      { date: '2026-04-10', guest_count: 12 },
      { date: '2026-04-11', guest_count: 15 },
      { date: '2026-04-12', guest_count: 20 },
    ]).as('guestHistory');

    cy.visit('/admin', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('token', 'admin-token');
        win.sessionStorage.setItem(
          'user',
          JSON.stringify({
            id: 1,
            name: 'Teszt Admin',
            email: 'admin@grillhouse.hu',
            role: 'admin',
            on_shift: true,
          })
        );
      },
    });

    cy.wait('@waiters');
    cy.wait('@todayGuests');
    cy.wait('@tables');
    cy.wait('@revenue');
    cy.wait('@guestHistory');

    cy.url().should('include', '/admin/stats');
    cy.contains('Admin felület').should('be.visible');
    cy.contains('h2', 'Statisztikák').should('be.visible');
    cy.contains('Mai bevétel').should('be.visible');
    cy.contains('125000 Ft').should('be.visible');
  });
});
