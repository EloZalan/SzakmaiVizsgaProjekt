describe('Reservation Page', () => {
  const tomorrow = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  })();

  beforeEach(() => {
    cy.intercept('GET', '**/backend/api/tables/max-capacity', { max_capacity: 6 }).as('maxCapacity');
  });

  it('submits reservation successfully with mocked backend', () => {
    cy.intercept('POST', '**/backend/api/reservations', (req) => {
      expect(req.body.guest_name).to.eq('Kiss Pista');
      expect(req.body.phone_number).to.eq('+36301234567');
      expect(req.body.guest_count).to.eq(4);
      expect(req.body.start_time).to.match(/Z$/);

      req.reply({
        id: 55,
        table_id: 3,
        guest_name: req.body.guest_name,
        phone_number: req.body.phone_number,
        start_time: req.body.start_time,
        end_time: req.body.start_time,
        guest_count: req.body.guest_count,
      });
    }).as('createReservation');

    cy.visit('/reserve');
    cy.wait('@maxCapacity');

    cy.get('input[type="date"]').clear().type(tomorrow).blur();

    cy.get('input[placeholder="Kiss Pista"]').type('Kiss Pista');
    cy.get('input[placeholder="+36301234567"]').type('+36301234567');
    cy.get('input[type="number"]').clear().type('4');
    cy.get('textarea').type('Csendes sarok, ha lehet.');

    cy.get('select').find('option').its('length').should('be.greaterThan', 0);
    cy.contains('button', 'Foglalás elküldése').click();

    cy.wait('@createReservation');
    cy.contains('h3', 'Sikeres foglalás').should('be.visible');
    cy.contains('A foglalás sikeresen rögzítve lett.').should('be.visible');
  });

  it('shows capacity error and does not call reservation endpoint', () => {
    cy.intercept('POST', '**/backend/api/reservations').as('createReservation');

    cy.visit('/reserve');
    cy.wait('@maxCapacity');

    cy.get('input[type="date"]').clear().type(tomorrow).blur();

    cy.get('input[placeholder="Kiss Pista"]').type('Nagy Csoport');
    cy.get('input[placeholder="+36301234567"]').type('+36301234567');
    cy.get('input[type="number"]').clear().type('9');

    cy.contains('button', 'Foglalás elküldése').click();
    cy.contains('Nincs ekkora asztal az étteremben a megadott létszámhoz.').should('be.visible');

    cy.get('@createReservation.all').should('have.length', 0);
  });
});
