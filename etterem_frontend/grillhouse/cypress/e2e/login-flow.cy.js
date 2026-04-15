describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearAllSessionStorage();
    cy.clearAllLocalStorage();
  });

  it('shows validation errors and logs in waiter successfully', () => {
    cy.intercept('POST', '**/backend/api/login', (req) => {
      expect(req.body).to.deep.equal({
        email: 'waiter@grillhouse.hu',
        password: 'Titkos123',
      });

      req.reply({
        token: 'waiter-token',
        user: {
          id: 33,
          name: 'Teszt Pincér',
          email: 'waiter@grillhouse.hu',
          role: 'waiter',
          on_shift: false,
        },
      });
    }).as('login');

    cy.visit('/login');

    cy.contains('button', 'Bejelentkezés').click();
    cy.contains('Az email megadása kötelező.').should('be.visible');
    cy.contains('A jelszó megadása kötelező.').should('be.visible');

    cy.get('input[name="email"]').type('waiter@grillhouse.hu');
    cy.get('input[name="password"]').type('Titkos123');
    cy.contains('button', 'Bejelentkezés').click();

    cy.wait('@login');
    cy.url().should('include', '/waiter/user');
    cy.contains('h2', 'Pincér adatai').should('be.visible');
    cy.contains('Státusz:').should('be.visible');
  });

  it('shows backend auth error message on invalid credentials', () => {
    cy.intercept('POST', '**/backend/api/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginFail');

    cy.visit('/login');

    cy.get('input[name="email"]').type('bad@grillhouse.hu');
    cy.get('input[name="password"]').type('wrong');
    cy.contains('button', 'Bejelentkezés').click();

    cy.wait('@loginFail');
    cy.url().should('include', '/login');
    cy.get('input[name="email"]').should('have.value', 'bad@grillhouse.hu');
    cy.get('input[name="password"]').should('have.value', 'wrong');
    cy.contains('button', 'Bejelentkezés').should('be.visible');
  });
});
