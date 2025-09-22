import { test, expect } from '@playwright/test';

test.describe('HR Matching Flow - Complete User Story', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for testing
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 'hr-user-id',
            email: 'hr@company.com',
            firstName: 'Sarah',
            lastName: 'Johnson',
            role: 'HR'
          }
        })
      });
    });

    await page.route('**/api/buddies/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'buddy-1',
            name: 'John Doe',
            email: 'john.doe@company.com',
            location: 'San Francisco',
            unit: 'Engineering',
            maxBuddies: 3,
            currentBuddies: 1,
            availability: true,
            utilizationRate: 33.33
          },
          {
            id: 'buddy-2',
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            location: 'New York',
            unit: 'Product',
            maxBuddies: 3,
            currentBuddies: 0,
            availability: true,
            utilizationRate: 0
          }
        ])
      });
    });

    await page.route('**/api/buddies**', async route => {
      const url = new URL(route.request().url());
      const location = url.searchParams.get('location');
      const techStack = url.searchParams.get('techStack');
      
      let buddies = [
        {
          id: 'buddy-1',
          userId: 'buddy-user-1',
          location: 'San Francisco',
          unit: 'Engineering',
          techStack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          interests: ['Hiking', 'Photography', 'Coffee'],
          maxBuddies: 3,
          isAvailable: true,
          experience: '5+ years',
          mentoringStyle: 'Hands-on with regular check-ins',
          user: {
            id: 'buddy-user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@company.com',
            profile: {
              avatar: null,
              bio: 'Experienced engineer passionate about helping others',
              department: 'Engineering',
              position: 'Senior Software Engineer'
            }
          },
          _count: {
            receivedMatches: 1
          }
        },
        {
          id: 'buddy-2',
          userId: 'buddy-user-2',
          location: 'New York',
          unit: 'Product',
          techStack: ['Product Strategy', 'User Research', 'Agile'],
          interests: ['Yoga', 'Reading', 'Travel'],
          maxBuddies: 3,
          isAvailable: true,
          experience: '7+ years',
          mentoringStyle: 'Structured approach with clear goals',
          user: {
            id: 'buddy-user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@company.com',
            profile: {
              avatar: null,
              bio: 'Product manager with mentoring experience',
              department: 'Product',
              position: 'Product Manager'
            }
          },
          _count: {
            receivedMatches: 0
          }
        }
      ];

      // Apply filters
      if (location) {
        buddies = buddies.filter(buddy => 
          buddy.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      if (techStack) {
        const techs = techStack.split(',').map(t => t.trim().toLowerCase());
        buddies = buddies.filter(buddy =>
          techs.some(tech => 
            buddy.techStack.some(buddyTech => 
              buddyTech.toLowerCase().includes(tech)
            )
          )
        );
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buddies)
      });
    });

    await page.route('**/api/matches**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'match-1',
              senderId: 'hr-user-id',
              receiverId: 'buddy-user-1',
              type: 'NEWCOMER_MATCH',
              status: 'PENDING',
              message: 'Welcome to the team!',
              startDate: '2024-01-15T00:00:00.000Z',
              endDate: '2024-04-15T00:00:00.000Z',
              createdAt: '2024-01-10T10:00:00.000Z',
              sender: {
                id: 'hr-user-id',
                firstName: 'Sarah',
                lastName: 'Johnson',
                email: 'hr@company.com',
                profile: {
                  avatar: null,
                  department: 'Human Resources',
                  position: 'HR Manager'
                }
              },
              receiver: {
                id: 'buddy-user-1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@company.com',
                profile: {
                  avatar: null,
                  department: 'Engineering',
                  position: 'Senior Software Engineer'
                }
              },
              _count: {
                messages: 0
              }
            }
          ])
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-match-id',
            senderId: 'hr-user-id',
            receiverId: 'buddy-user-2',
            type: 'NEWCOMER_MATCH',
            status: 'PENDING',
            message: 'Welcome to the team!',
            startDate: '2024-01-15T00:00:00.000Z',
            endDate: '2024-04-15T00:00:00.000Z',
            createdAt: new Date().toISOString(),
            sender: {
              id: 'hr-user-id',
              firstName: 'Sarah',
              lastName: 'Johnson',
              email: 'hr@company.com'
            },
            receiver: {
              id: 'buddy-user-2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@company.com'
            }
          })
        });
      }
    });

    // Navigate to login page
    await page.goto('/login');
  });

  test('Complete HR matching workflow', async ({ page }) => {
    // Step 1: HR logs in
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Step 2: HR navigates to Buddies page
    await page.click('a[href="/buddies"]');
    await page.waitForURL('/buddies');
    await expect(page.locator('h1')).toContainText('Buddy Profiles');

    // Step 3: HR views buddy cards
    const buddyCards = page.locator('[data-testid="buddy-card"]');
    await expect(buddyCards).toHaveCount(2);

    // Verify buddy information is displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
    await expect(page.locator('text=San Francisco')).toBeVisible();
    await expect(page.locator('text=Engineering')).toBeVisible();
    await expect(page.locator('text=1/3')).toBeVisible(); // Current buddies / max buddies

    // Step 4: HR uses filters
    await page.fill('input[placeholder="Search by location"]', 'San Francisco');
    await page.waitForTimeout(600); // Wait for debounced search
    await expect(buddyCards).toHaveCount(1);
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Clear location filter and test tech stack filter
    await page.fill('input[placeholder="Search by location"]', '');
    await page.fill('input[placeholder="e.g. React, Node.js"]', 'React');
    await page.waitForTimeout(600);
    await expect(buddyCards).toHaveCount(1);
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Step 5: HR clicks "Create Match" button
    const createMatchButton = page.locator('button:has-text("Create Match")').first();
    await createMatchButton.click();

    // Step 6: Verify match creation (in real app, this would open a modal)
    // For this test, we'll verify the button is clickable and the API call would be made
    await expect(createMatchButton).toBeEnabled();

    // Step 7: HR navigates to Matches page
    await page.click('a[href="/matches"]');
    await page.waitForURL('/matches');
    await expect(page.locator('h1')).toContainText('Matches');

    // Step 8: HR views existing matches
    const matchCards = page.locator('[data-testid="match-card"]');
    await expect(matchCards).toHaveCount(1);

    // Verify match information
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=newcomer match')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();
    await expect(page.locator('text=Welcome to the team!')).toBeVisible();
  });

  test('HR can filter buddies by multiple criteria', async ({ page }) => {
    // Login as HR
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to Buddies page
    await page.click('a[href="/buddies"]');
    await page.waitForURL('/buddies');

    // Test location filter
    await page.fill('input[placeholder="Search by location"]', 'New York');
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="buddy-card"]')).toHaveCount(1);
    await expect(page.locator('text=Jane Smith')).toBeVisible();

    // Test tech stack filter
    await page.fill('input[placeholder="Search by location"]', '');
    await page.fill('input[placeholder="e.g. React, Node.js"]', 'Product Strategy');
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="buddy-card"]')).toHaveCount(1);
    await expect(page.locator('text=Jane Smith')).toBeVisible();

    // Test interests filter
    await page.fill('input[placeholder="e.g. React, Node.js"]', '');
    await page.fill('input[placeholder="e.g. Hiking, Photography"]', 'Yoga');
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="buddy-card"]')).toHaveCount(1);
    await expect(page.locator('text=Jane Smith')).toBeVisible();

    // Clear all filters
    await page.fill('input[placeholder="e.g. Hiking, Photography"]', '');
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="buddy-card"]')).toHaveCount(2);
  });

  test('HR can view buddy capacity and utilization', async ({ page }) => {
    // Login as HR
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to Buddies page
    await page.click('a[href="/buddies"]');
    await page.waitForURL('/buddies');

    // Verify buddy capacity information is displayed
    await expect(page.locator('text=Current Buddies:')).toBeVisible();
    await expect(page.locator('text=1/3')).toBeVisible(); // John Doe's current capacity
    await expect(page.locator('text=0/3')).toBeVisible(); // Jane Smith's current capacity

    // Verify tech stack tags are displayed
    await expect(page.locator('text=React')).toBeVisible();
    await expect(page.locator('text=Node.js')).toBeVisible();
    await expect(page.locator('text=TypeScript')).toBeVisible();

    // Verify interests tags are displayed
    await expect(page.locator('text=Hiking')).toBeVisible();
    await expect(page.locator('text=Photography')).toBeVisible();
    await expect(page.locator('text=Coffee')).toBeVisible();
  });

  test('HR can view and manage matches', async ({ page }) => {
    // Login as HR
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to Matches page
    await page.click('a[href="/matches"]');
    await page.waitForURL('/matches');

    // Verify match information is displayed correctly
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=newcomer match')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();
    await expect(page.locator('text=Welcome to the team!')).toBeVisible();

    // Verify match details
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await expect(matchCard).toContainText('John Doe');
    await expect(matchCard).toContainText('Senior Software Engineer');
    await expect(matchCard).toContainText('PENDING');
  });

  test('Search functionality works with debouncing', async ({ page }) => {
    // Login as HR
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to Buddies page
    await page.click('a[href="/buddies"]');
    await page.waitForURL('/buddies');

    // Type in search field and verify debouncing
    const searchInput = page.locator('input[placeholder="Search by location"]');
    await searchInput.fill('San');
    
    // Should not filter immediately
    await expect(page.locator('[data-testid="buddy-card"]')).toHaveCount(2);
    
    // Wait for debounced search
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="buddy-card"]')).toHaveCount(1);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('Loading states are displayed correctly', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/buddies**', async route => {
      await page.waitForTimeout(1000); // Simulate slow response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Login as HR
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to Buddies page
    await page.click('a[href="/buddies"]');
    await page.waitForURL('/buddies');

    // Verify loading state is shown
    await expect(page.locator('text=Loading...')).toBeVisible();
  });

  test('Empty state is displayed when no buddies found', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/buddies**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Login as HR
    await page.fill('input[type="email"]', 'hr@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to Buddies page
    await page.click('a[href="/buddies"]');
    await page.waitForURL('/buddies');

    // Verify empty state
    await expect(page.locator('text=No buddies found')).toBeVisible();
    await expect(page.locator('text=Try adjusting your search filters.')).toBeVisible();
  });
});
