// In-memory storage implementation for development
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // Add your storage operations here
  // For example:
  // getUser(id: number): Promise<User | undefined>;
  // createUser(user: InsertUser): Promise<User>;
  
  // User management
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  updateUser(id: number, updates: Partial<any>): Promise<any>;
  updateStripeCustomerId(id: number, customerId: string): Promise<any>;
  updateUserStripeInfo(id: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<any>;
  
  // Payment methods
  getPaymentMethods(userId: number): Promise<any[]>;
  getPaymentMethod(id: number): Promise<any | undefined>;
  addPaymentMethod(userId: number, paymentMethod: any): Promise<any>;
  updatePaymentMethod(id: string | number, updates: Partial<any>): Promise<any>;
  
  // Virtual cards
  getVirtualCards(userId: number): Promise<any[]>;
  getVirtualCard(id: string): Promise<any | undefined>;
  createVirtualCard(userId: number, card: any): Promise<any>;
  
  // Transactions
  getTransactionsByVirtualCard(virtualCardId: string): Promise<any[]>;
  createTransaction(transaction: any): Promise<any>;
  
  // System settings
  getSystemSettings(): Promise<any[]>;
  getSystemSettingsByCategory(category: string): Promise<any[]>;
  getSystemSettingByKey(key: string): Promise<any | undefined>;
  createSystemSetting(setting: any): Promise<any>;
  updateSystemSetting(key: string, updates: Partial<any>): Promise<any>;
  deleteSystemSetting(key: string): Promise<boolean>;
  
  // Content Management - Page Content
  getAllPageContent(): Promise<any[]>;
  getPageContent(pageId: string): Promise<any | undefined>;
  createPageContent(pageContent: any): Promise<any>;
  updatePageContent(pageId: string, updates: Partial<any>): Promise<any>;
  deletePageContent(pageId: string): Promise<boolean>;
  
  // Content Management - Section Content
  getSectionsByPage(pageId: string): Promise<any[]>;
  getSectionContent(pageId: string, sectionId: string): Promise<any | undefined>;
  createSectionContent(pageId: string, sectionData: any): Promise<any>;
  updateSectionContent(pageId: string, sectionId: string, updates: Partial<any>): Promise<any>;
  deleteSectionContent(pageId: string, sectionId: string): Promise<boolean>;
  
  // Content Management - Media Library
  getAllMedia(): Promise<any[]>;
  getMedia(mediaId: number): Promise<any | undefined>;
  createMedia(mediaData: any): Promise<any>;
  updateMedia(mediaId: number, updates: Partial<any>): Promise<any>;
  deleteMedia(mediaId: number): Promise<boolean>;
  
  // Content Management - Theme Settings
  getAllThemes(): Promise<any[]>;
  getActiveTheme(): Promise<any | undefined>;
  getTheme(themeId: number): Promise<any | undefined>;
  createTheme(themeData: any): Promise<any>;
  updateTheme(themeId: number, updates: Partial<any>): Promise<any>;
  activateTheme(themeId: number): Promise<any>;
  deleteTheme(themeId: number): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: any; // Using any type to avoid type errors
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: any[] = [];
  private paymentMethods: any[] = [];
  private virtualCards: any[] = [];
  private transactions: any[] = []; // Add transactions array
  private systemSettings: any[] = [];
  private pageContents: any[] = [];
  private sectionContents: any[] = [];
  private mediaLibrary: any[] = [];
  private themeSettings: any[] = [];
  
  sessionStore: any; // Using any type to avoid type errors
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize default system settings - do this synchronously in constructor
    this.initDefaultSystemSettings();
    
    // Initialize admin user if none exists
    this.initAdminUser();
    
    // Initialize default homepage content
    this.initDefaultPageContent();
    
    // Initialize default theme
    this.initDefaultTheme();
    
    // Initialize demo data for testing
    this.initDemoData();
  }
  
  private async initDemoData() {
    // Check if we already have demo data
    if (this.virtualCards.length > 0 || this.transactions.length > 0) {
      return;
    }
    
    // Create a default user with ID 1 if not exists
    let demoUser = this.users.find(user => user.id === 1);
    if (!demoUser) {
      demoUser = {
        id: 1,
        username: 'demo',
        password: '$2a$10$M7Jk.f2JQT9QSuJnQW0hkePx7zUQ7W01/QUOv1yEE5zQZfdC5eEyG', // hash for 'admin123'
        email: 'demo@getbpay.com',
        fullName: 'Demo User',
        isAdmin: false,
        createdAt: new Date(),
      };
      this.users.push(demoUser);
    }
    
    // Create a payment method for the user
    const demoPaymentMethod = {
      id: 'pm_demo1',
      userId: 1,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      },
      createdAt: new Date()
    };
    this.paymentMethods.push(demoPaymentMethod);
    
    // Create a virtual card for the user
    const demoVirtualCard = {
      id: 'card_demo1',
      userId: 1,
      name: 'Shopping Card',
      cardholderName: 'Demo User',
      status: 'active',
      lastFour: '5678',
      cardNumber: 'XXXX-XXXX-XXXX-5678',
      expiryDate: '12/25',
      cvv: '123',
      balance: 150.00,
      createdAt: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
      isOneTime: false,
      fundingSources: [{
        id: demoPaymentMethod.id,
        type: 'card',
        amount: 150.00
      }],
      stripeCardId: 'ic_demo1'
    };
    this.virtualCards.push(demoVirtualCard);
    
    // Create some sample transactions
    const today = new Date();
    
    // Initial funding transaction
    const initialFunding = {
      id: 'tx_funding1',
      virtualCardId: demoVirtualCard.id,
      merchant: 'bPay Funding',
      description: 'Initial card funding',
      amount: 150.00,
      date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      status: 'completed',
      type: 'funding',
      cardLastFour: demoVirtualCard.lastFour,
      createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
    this.transactions.push(initialFunding);
    
    // Purchase transactions
    const purchases = [
      {
        merchant: 'Amazon',
        description: 'Online shopping',
        amount: 23.45,
        daysAgo: 25
      },
      {
        merchant: 'Starbucks',
        description: 'Coffee',
        amount: 5.35,
        daysAgo: 20
      },
      {
        merchant: 'Uber',
        description: 'Ride share',
        amount: 12.50,
        daysAgo: 15
      },
      {
        merchant: 'Netflix',
        description: 'Subscription',
        amount: 14.99,
        daysAgo: 10
      },
      {
        merchant: 'Target',
        description: 'Retail purchase',
        amount: 47.25,
        daysAgo: 5
      },
      {
        merchant: 'Apple',
        description: 'App Store purchase',
        amount: 1.99,
        daysAgo: 2
      }
    ];
    
    for (const purchase of purchases) {
      const txDate = new Date(today.getTime() - purchase.daysAgo * 24 * 60 * 60 * 1000);
      const transaction = {
        id: `tx_${Math.random().toString(36).substring(2, 10)}`,
        virtualCardId: demoVirtualCard.id,
        merchant: purchase.merchant,
        description: purchase.description,
        amount: -purchase.amount, // Negative for purchases
        date: txDate,
        status: 'completed',
        type: 'purchase',
        cardLastFour: demoVirtualCard.lastFour,
        createdAt: txDate
      };
      this.transactions.push(transaction);
    }
  }
  
  private initDefaultPageContent() {
    // Check if homepage content exists
    if (this.pageContents.length === 0) {
      // Create homepage content
      const homepageContent = {
        id: 1,
        pageId: 'homepage',
        title: 'Checkout Your Way. Complete Every Purchase.',
        description: 'Split payments across your cards, accounts, and wallets—control how you spend, and never abandon a cart again.',
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.pageContents.push(homepageContent);
      
      // Create hero section content
      const heroSection = {
        id: 1,
        pageId: 'homepage',
        sectionId: 'hero',
        name: 'Hero Section',
        content: {
          heading: 'Checkout Your Way. Complete Every Purchase.',
          subheading: 'Empower your wallet. Split payments across your cards, accounts, and wallets—control how you spend, and never abandon a cart again.',
          ctaText: 'Get Started',
          ctaLink: '/auth',
          secondaryCtaText: 'Learn More',
          secondaryCtaLink: '#how-it-works'
        },
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.sectionContents.push(heroSection);
      
      // Create features section content
      const featuresSection = {
        id: 2,
        pageId: 'homepage',
        sectionId: 'features',
        name: 'Features Section',
        content: {
          heading: 'Key Features',
          items: [
            {
              title: 'For Buyers',
              description: 'No more checkout failures due to insufficient funds on a single card.',
              features: [
                'Pay the way you want',
                'Stay within personal limits',
                'Finish checkout in just a few clicks',
                'Works with our browser extension on any site',
                'Create virtual cards for secure transactions'
              ]
            },
            {
              title: 'For Merchants',
              description: 'Reduce cart abandonment and increase conversion rates.',
              features: [
                'Higher checkout success rate',
                'Lower drop-offs at payment stage',
                'A better experience for your customers',
                'Simple WooCommerce plugin integration',
                'Single payment settlement on your end'
              ]
            }
          ]
        },
        order: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.sectionContents.push(featuresSection);
      
      // Create how it works section content
      const howItWorksSection = {
        id: 3,
        pageId: 'homepage',
        sectionId: 'how-it-works',
        name: 'How It Works Section',
        content: {
          heading: 'How It Works',
          steps: [
            {
              number: 1,
              title: 'Link Payment Methods',
              description: 'Connect your credit cards, debit cards, and digital wallets in one place.'
            },
            {
              number: 2,
              title: 'Smart Split',
              description: 'Distribute payment amounts across your funding sources based on available balances.'
            },
            {
              number: 3,
              title: 'Instant Checkout',
              description: 'Complete your purchase in seconds with our seamless checkout process.'
            }
          ]
        },
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.sectionContents.push(howItWorksSection);
    }
  }
  
  private initDefaultTheme() {
    // Check if a theme exists
    if (this.themeSettings.length === 0) {
      // Create default theme
      const defaultTheme = {
        id: 1,
        name: 'Default Theme',
        primaryColor: '#3b82f6', // blue-500
        backgroundColor: '#f9fafb', // gray-50
        textColor: '#111827', // gray-900
        accentColor: '#2563eb', // blue-600
        secondaryColor: '#4b5563', // gray-600
        fontPrimary: 'Inter, sans-serif',
        fontSecondary: 'Inter, sans-serif',
        borderRadius: '0.5rem',
        buttonStyle: 'rounded',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.themeSettings.push(defaultTheme);
    }
  }
  
  private initAdminUser() {
    // Check if admin user already exists
    const adminExists = this.users.some(user => user.isAdmin === true);
    if (!adminExists) {
      // Create admin user
      const adminUser = {
        id: this.users.length + 1,
        username: 'admin',
        password: '$2a$10$M7Jk.f2JQT9QSuJnQW0hkePx7zUQ7W01/QUOv1yEE5zQZfdC5eEyG', // hash for 'admin123'
        email: 'admin@getbpay.com',
        fullName: 'System Administrator',
        isAdmin: true,
        createdAt: new Date(),
      };
      this.users.push(adminUser);
      console.log('Admin user initialized with username: admin');
    }
  }
  
  private initDefaultSystemSettings() {
    // Check if card provider setting exists
    const cardProviderSetting = this.systemSettings.find(s => s.key === 'card_provider');
    if (!cardProviderSetting) {
      // Create default card provider setting (Stripe)
      const newSetting = {
        id: this.systemSettings.length + 1,
        key: 'card_provider',
        value: 'stripe',
        description: 'The service provider for virtual card issuance',
        category: 'payment',
        isSecret: false,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      this.systemSettings.push(newSetting);
    }
    
    // Initialize regional providers setting
    const regionalProvidersSetting = this.systemSettings.find(s => s.key === 'regional_card_providers');
    if (!regionalProvidersSetting) {
      // Create empty regional providers setting
      const newSetting = {
        id: this.systemSettings.length + 1,
        key: 'regional_card_providers',
        valueJson: {},
        description: 'Configuration for region-specific card providers',
        category: 'payment',
        isSecret: false,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      this.systemSettings.push(newSetting);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<any | undefined> {
    return this.users.find(user => user.id === id);
  }
  
  async getUserByUsername(username: string): Promise<any | undefined> {
    return this.users.find(user => user.username === username);
  }
  
  async createUser(user: any): Promise<any> {
    const newUser = {
      id: this.users.length + 1,
      ...user,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<any>): Promise<any> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error(`User with id ${id} not found`);
    
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }
  
  async updateStripeCustomerId(id: number, customerId: string): Promise<any> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }
  
  async updateUserStripeInfo(id: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<any> {
    return this.updateUser(id, {
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId
    });
  }
  
  // Payment methods
  async getPaymentMethods(userId: number): Promise<any[]> {
    return this.paymentMethods.filter(pm => pm.userId === userId);
  }
  
  async getPaymentMethod(id: number): Promise<any | undefined> {
    return this.paymentMethods.find(pm => pm.id.toString() === id.toString());
  }
  
  async addPaymentMethod(userId: number, paymentMethod: any): Promise<any> {
    const newPaymentMethod = {
      id: `pm_${Math.random().toString(36).substring(2, 10)}`,
      userId,
      ...paymentMethod,
      createdAt: new Date(),
    };
    this.paymentMethods.push(newPaymentMethod);
    return newPaymentMethod;
  }
  
  async updatePaymentMethod(id: string | number, updates: Partial<any>): Promise<any> {
    const paymentMethodIndex = this.paymentMethods.findIndex(pm => pm.id.toString() === id.toString());
    
    if (paymentMethodIndex === -1) {
      throw new Error(`Payment method with ID ${id} not found`);
    }
    
    // Update payment method with new values
    const updatedPaymentMethod = {
      ...this.paymentMethods[paymentMethodIndex],
      ...updates
    };
    
    // Replace the payment method in the array
    this.paymentMethods[paymentMethodIndex] = updatedPaymentMethod;
    
    return updatedPaymentMethod;
  }
  
  // Virtual cards
  async getVirtualCards(userId: number): Promise<any[]> {
    return this.virtualCards.filter(card => card.userId === userId);
  }
  
  async getVirtualCard(id: string): Promise<any | undefined> {
    return this.virtualCards.find(card => card.id === id);
  }
  
  async createVirtualCard(userId: number, card: any): Promise<any> {
    const newCard = {
      id: `card_${Math.random().toString(36).substring(2, 10)}`,
      userId,
      ...card,
      createdAt: new Date(),
    };
    this.virtualCards.push(newCard);
    
    // If the card has initial funding, create a funding transaction
    if (card.balance && parseFloat(card.balance) > 0) {
      await this.createTransaction({
        virtualCardId: newCard.id,
        merchant: "bPay Funding",
        description: "Initial card funding",
        amount: parseFloat(card.balance),
        date: new Date(),
        status: "completed",
        type: "funding",
        cardLastFour: newCard.lastFour
      });
    }
    
    return newCard;
  }
  
  // Transaction methods
  async getTransactionsByVirtualCard(virtualCardId: string): Promise<any[]> {
    return this.transactions.filter(tx => tx.virtualCardId === virtualCardId);
  }
  
  async createTransaction(transaction: any): Promise<any> {
    const newTransaction = {
      id: `tx_${Math.random().toString(36).substring(2, 10)}`,
      ...transaction,
      date: transaction.date || new Date(),
      createdAt: new Date(),
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }
  
  // System settings methods
  async getSystemSettings(): Promise<any[]> {
    return this.systemSettings;
  }
  
  async getSystemSettingsByCategory(category: string): Promise<any[]> {
    return this.systemSettings.filter(setting => setting.category === category);
  }
  
  async getSystemSettingByKey(key: string): Promise<any | undefined> {
    return this.systemSettings.find(setting => setting.key === key);
  }
  
  async createSystemSetting(setting: any): Promise<any> {
    const newSetting = {
      id: this.systemSettings.length + 1,
      ...setting,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    this.systemSettings.push(newSetting);
    return newSetting;
  }
  
  async updateSystemSetting(key: string, updates: Partial<any>): Promise<any> {
    const index = this.systemSettings.findIndex(setting => setting.key === key);
    if (index === -1) throw new Error(`Setting with key ${key} not found`);
    
    this.systemSettings[index] = { 
      ...this.systemSettings[index], 
      ...updates,
      updatedAt: new Date()
    };
    return this.systemSettings[index];
  }
  
  async deleteSystemSetting(key: string): Promise<boolean> {
    const index = this.systemSettings.findIndex(setting => setting.key === key);
    if (index === -1) return false;
    
    this.systemSettings.splice(index, 1);
    return true;
  }

  // Content Management - Page Content
  async getAllPageContent(): Promise<any[]> {
    return this.pageContents;
  }

  async getPageContent(pageId: string): Promise<any | undefined> {
    return this.pageContents.find(page => page.pageId === pageId);
  }

  async createPageContent(pageContent: any): Promise<any> {
    const newPageContent = {
      id: this.pageContents.length + 1,
      ...pageContent,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.pageContents.push(newPageContent);
    return newPageContent;
  }

  async updatePageContent(pageId: string, updates: Partial<any>): Promise<any> {
    const index = this.pageContents.findIndex(page => page.pageId === pageId);
    if (index === -1) throw new Error(`Page content with id ${pageId} not found`);
    
    this.pageContents[index] = { 
      ...this.pageContents[index], 
      ...updates,
      updatedAt: new Date()
    };
    return this.pageContents[index];
  }

  async deletePageContent(pageId: string): Promise<boolean> {
    const index = this.pageContents.findIndex(page => page.pageId === pageId);
    if (index === -1) return false;
    
    this.pageContents.splice(index, 1);
    return true;
  }

  // Content Management - Section Content
  async getSectionsByPage(pageId: string): Promise<any[]> {
    return this.sectionContents.filter(section => section.pageId === pageId);
  }

  async getSectionContent(pageId: string, sectionId: string): Promise<any | undefined> {
    return this.sectionContents.find(
      section => section.pageId === pageId && section.sectionId === sectionId
    );
  }

  async createSectionContent(pageId: string, sectionData: any): Promise<any> {
    console.log('MemStorage.createSectionContent - pageId:', pageId);
    console.log('MemStorage.createSectionContent - sectionData:', sectionData);
    
    // Create a new section with the pageId from the parameter
    const newSectionContent = {
      id: this.sectionContents.length + 1,
      ...sectionData,
      pageId: pageId, // Make sure to use the pageId passed as parameter
      sectionId: sectionData.sectionId || `section-${Date.now()}`, // Ensure we have a sectionId
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.sectionContents.push(newSectionContent);
    console.log('MemStorage.createSectionContent - Created section:', newSectionContent);
    return newSectionContent;
  }

  async updateSectionContent(pageId: string, sectionId: string, updates: Partial<any>): Promise<any> {
    const index = this.sectionContents.findIndex(
      section => section.pageId === pageId && section.sectionId === sectionId
    );
    if (index === -1) throw new Error(`Section content for page ${pageId}, section ${sectionId} not found`);
    
    this.sectionContents[index] = { 
      ...this.sectionContents[index], 
      ...updates,
      updatedAt: new Date()
    };
    return this.sectionContents[index];
  }

  async deleteSectionContent(pageId: string, sectionId: string): Promise<boolean> {
    const index = this.sectionContents.findIndex(
      section => section.pageId === pageId && section.sectionId === sectionId
    );
    if (index === -1) return false;
    
    this.sectionContents.splice(index, 1);
    return true;
  }

  // Content Management - Media Library
  async getAllMedia(): Promise<any[]> {
    return this.mediaLibrary;
  }

  async getMedia(mediaId: number): Promise<any | undefined> {
    return this.mediaLibrary.find(media => media.id === mediaId);
  }

  async createMedia(mediaData: any): Promise<any> {
    const newMedia = {
      id: this.mediaLibrary.length + 1,
      ...mediaData,
      createdAt: new Date()
    };
    this.mediaLibrary.push(newMedia);
    return newMedia;
  }

  async updateMedia(mediaId: number, updates: Partial<any>): Promise<any> {
    const index = this.mediaLibrary.findIndex(media => media.id === mediaId);
    if (index === -1) throw new Error(`Media with id ${mediaId} not found`);
    
    this.mediaLibrary[index] = { 
      ...this.mediaLibrary[index], 
      ...updates
    };
    return this.mediaLibrary[index];
  }

  async deleteMedia(mediaId: number): Promise<boolean> {
    const index = this.mediaLibrary.findIndex(media => media.id === mediaId);
    if (index === -1) return false;
    
    this.mediaLibrary.splice(index, 1);
    return true;
  }

  // Content Management - Theme Settings
  async getAllThemes(): Promise<any[]> {
    return this.themeSettings;
  }

  async getActiveTheme(): Promise<any | undefined> {
    return this.themeSettings.find(theme => theme.isActive === true);
  }

  async getTheme(themeId: number): Promise<any | undefined> {
    return this.themeSettings.find(theme => theme.id === themeId);
  }

  async createTheme(themeData: any): Promise<any> {
    // If this is the first theme, make it active
    const isFirstTheme = this.themeSettings.length === 0;
    
    const newTheme = {
      id: this.themeSettings.length + 1,
      ...themeData,
      isActive: isFirstTheme || themeData.isActive === true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // If this theme is active, deactivate all others
    if (newTheme.isActive) {
      this.themeSettings.forEach(theme => {
        theme.isActive = false;
      });
    }
    
    this.themeSettings.push(newTheme);
    return newTheme;
  }

  async updateTheme(themeId: number, updates: Partial<any>): Promise<any> {
    const index = this.themeSettings.findIndex(theme => theme.id === themeId);
    if (index === -1) throw new Error(`Theme with id ${themeId} not found`);
    
    // If we're activating this theme, deactivate all others
    if (updates.isActive === true) {
      this.themeSettings.forEach(theme => {
        theme.isActive = false;
      });
    }
    
    this.themeSettings[index] = { 
      ...this.themeSettings[index], 
      ...updates,
      updatedAt: new Date()
    };
    return this.themeSettings[index];
  }

  async activateTheme(themeId: number): Promise<any> {
    // Deactivate all themes
    this.themeSettings.forEach(theme => {
      theme.isActive = false;
    });
    
    // Activate the specified theme
    const index = this.themeSettings.findIndex(theme => theme.id === themeId);
    if (index === -1) throw new Error(`Theme with id ${themeId} not found`);
    
    this.themeSettings[index].isActive = true;
    this.themeSettings[index].updatedAt = new Date();
    
    return this.themeSettings[index];
  }

  async deleteTheme(themeId: number): Promise<boolean> {
    const index = this.themeSettings.findIndex(theme => theme.id === themeId);
    if (index === -1) return false;
    
    // If deleting the active theme, check if there are other themes
    if (this.themeSettings[index].isActive && this.themeSettings.length > 1) {
      // Activate another theme
      const otherThemeIndex = this.themeSettings.findIndex(theme => theme.id !== themeId);
      if (otherThemeIndex !== -1) {
        this.themeSettings[otherThemeIndex].isActive = true;
        this.themeSettings[otherThemeIndex].updatedAt = new Date();
      }
    }
    
    this.themeSettings.splice(index, 1);
    return true;
  }
}

// Export a single instance of the storage
import { DatabaseStorage } from './databaseStorage';

// Use database storage in production, memory storage for development if needed
export const storage = new DatabaseStorage();